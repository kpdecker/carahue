var _ = require('underscore'),
    Config = require('./config'),
    fs = require('fs'),
    path = require('path'),
    resemble = require('resemble');

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
        var self = this;
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
      });
    });
  },

  thenScreenshot: function(name, selector, ignore) {
    if (ignore) {
      this.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', 'hidden');
      }, ignore);
    }

    var fullTitle = this.test.fullTitle().replace(/\s/g, '-');
    if (name) {
      name = fullTitle + '-' + name;
    } else {
      name = fullTitle;
    }

    this.then([{name: name, selector: selector || 'body'}, function() {
      var image = this.captureBase64('PNG', selector);
      image = image.replace(/^data:image\/png;base64,/,'');
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
        throw new Error('Failed to capture image: "' + name + '"');
      }

      var testPath = path.join(context.screencapturePath, name) + '.png';
      fs.exists(testPath, function(exists) {
        image = new Buffer(image, 'base64');
        if (exists) {
          diffFile(name, testPath, image);
        } else {
          spooky.emit('console', 'Created test at ' + testPath);
          saveBase64(testPath, image, function() {
            spooky.emit('carahue.capture.complete');
          });
        }
      });
    });
  }

  function diffFile(name, testPath, image) {
    resemble.resemble(testPath)
        .compareTo(image)
        .ignoreAntialiasing()
        .onComplete(function(data) {
          if (parseFloat(data.misMatchPercentage) >= 0.05) {
            var failPath = path.join(context.failurePath, name) + '.fail.png',
                expectedPath = path.join(context.failurePath, name) + '.expected.png',
                diffPath = path.join(context.failurePath, name) + '.diff.png';

            saveBase64(failPath, image);
            fs.createReadStream(testPath).pipe(fs.createWriteStream(expectedPath));
            data.pngStream().pipe(fs.createWriteStream(diffPath));

            throw new Error('Screenshot "' + name + '" failed.'
                  + '\n\t  Difference: ' + data.misMatchPercentage
                  + '\n\t  See: ' + diffPath);
          }

          spooky.emit('carahue.capture.complete');
        });
  }
};

function saveBase64(path, image, fn) {
  fs.writeFile(path, image, 'base64', function(err) {
    if (err) {
      throw new Error('Failed to output ' + path + ' ' + err);
    }
    fn && fn();
  });
}
