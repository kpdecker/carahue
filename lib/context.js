var _ = require('underscore'),
    async = require('async'),
    Config = require('./config'),
    fs = require('fs'),
    path = require('path'),
    resemble = require('resemble'),
    wrench = require('wrench');

var contextSpec = {
  thenCheck: function(query, check) {
    return this.thenEvaluate(function(query, check) {
      if (check) {
        $(query).attr('checked', check);
      } else {
        $(query).removeAttr('checked');
      }
    }, {
      query: query,
      check: check !== false
    });
  },

  thenWaitForImages: function() {
    return this.then(function() {
      this.waitFor(function() {
        return this.evaluate(function() {
          var images = document.querySelectorAll('img');
          for (var i = 0; i < images.length; i++) {
            var curr = images[i];
            if (!curr.complete) {
              return false;
            }
          }
          return true;
        });
      },
      undefined,
      function() {
        var missing = this.evaluate(function() {
          var images = document.querySelectorAll('img'),
              missing = [];
          for (var i = 0; i < images.length; i++) {
            var curr = images[i];
            if (!curr.complete) {
              missing.push(curr.src);
            }
          }
          return missing;
        });
        this.die('Missing images: ' + missing.join(', '));
      },
      10000);
    });
  },

  thenScreenshot: function(name, selector, ignore) {
    if (this.globalIgnore) {
      ignore = this.globalIgnore + (ignore ? ', ' + ignore : '');
    }
    if (ignore) {
      this.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', 'hidden');
      }, ignore);
    }

    var paths = [],
        suite = this.test.parent;
    while (suite) {
      paths.unshift(suite.title);
      suite = suite.parent;
    }
    if (name) {
      paths.push(this.test.title + '-' + name);
    } else {
      paths.push(this.test.title);
    }

    name = paths.join('/');

    this._spooky.emit('carahue.capture.start', name);
    this.then([{name: name, selector: selector || ''}, function() {

      if (selector) {
        var bounds = this.getElementBounds(selector);
        if (!bounds.height || !bounds.width) {
          this.die('Selector "' + selector + '" has no visible area');
        }
      }

      // Execute twice as the layout logic isn't always correct without.
      this.captureBase64('PNG', {
        top: 0, left: 0,
        width: 1, height: 1
      });

      var image = this.captureBase64('PNG', selector || undefined);
      this.emit('carahue.capture', name, image);
    }]);

    if (ignore) {
      this.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', '');
      }, ignore);
    }
    return this;
  }
};

module.exports.extend = function(helpers) {
  _.extend(contextSpec, helpers);
};

module.exports.inject = function(context, spooky) {
  if (!context.thenCheck) {
    _.defaults(context, Config.get());
    _.defaults(context, contextSpec);
    context._spooky = spooky;
  }

  if (!spooky._carahueCapture) {
    spooky._carahueCapture = true;
    ['then', 'thenClick', 'thenEvaluate', 'thenOpen', 'thenOpenAndEvaluate'].forEach(function(name) {
      context[name] = function() {
        spooky[name].apply(spooky, arguments);
        return this;
      };
    });

    spooky.on('carahue.capture', function(name, image) {
      if (!image || !image.length) {
        return process.nextTick(function() {
          throw new Error('Failed to capture image: "' + name + '" - Empty response');
        });
      }

      var testPath = path.join(context.screencapturePath, name) + '.png';
      fs.exists(testPath, function(exists) {
        image = bufferFromData(image);
        if (exists) {
          diffFile(name, testPath, image);
        } else {
          spooky.emit('console', 'Created test at ' + testPath);
          writeFile(testPath, image, function() {
            spooky.emit('carahue.capture.complete');
          });
        }
      });
    });
  }

  function diffFile(name, testPath, image) {
    fs.readFile(testPath, function(err, expected) {
      if (err) {
        throw err;
      }

      resemble.resemble(expected)
        .compareTo(image)
        .ignoreAntialiasing()
        .onComplete(function(data) {
          if (parseFloat(data.misMatchPercentage) >= 0.05) {
            var basePath = path.join(context.failurePath, name),
                failPath = basePath + '.fail.png',
                expectedPath = basePath + '.expected.png',
                diffPath = basePath + '.diff.png';

            return async.parallel([
              function(callback) {
                writeFile(expectedPath, expected, callback);
              },
              function(callback) {
                writeFile(failPath, image, callback);
              },
              function(callback) {
                writeFile(diffPath, bufferFromData(data.getImageDataUrl()), callback);
              }
            ],
            function() {
              spooky.emit('carahue.capture.complete',
                    'Screenshot "' + name + '" failed.'
                    + '\n\t  Difference: ' + data.misMatchPercentage
                    + '\n\t  See: ' + diffPath);
            });
          }

          spooky.emit('carahue.capture.complete');
        });
    });
  }
};

function bufferFromData(data) {
  data = data.replace(/^data:image\/png;base64,/,'');
  return new Buffer(data, 'base64');
}

function writeFile(fileName, image, fn) {
  wrench.mkdirSyncRecursive(path.dirname(fileName));

  fs.writeFile(fileName, image, function(err) {
    if (err) {
      throw new Error('Failed to output ' + path + ' ' + err);
    }
    fn && fn();
  });
}
