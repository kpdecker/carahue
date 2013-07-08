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
        var images = document.querySelectorAll('img');
        return !images.length || images.reduce(function(prev, curr) { return prev && curr.complete; }, true);
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

    var capturePath = path.join(this.tmpDir, name) + '.png';
    this.then([{name: name, capturePath: capturePath, selector: selector || 'body'}, function() {
      this.captureSelector(capturePath, selector);
      this.emit('carahue.capture', name, capturePath);
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

    spooky.on('carahue.capture', function(name, capturePath) {
      var testPath = path.join(context.screencapturePath, name) + '.png';
      fs.exists(testPath, function(exists) {
        if (exists) {
          diffFile(name, testPath, capturePath);
        } else {
          spooky.emit('console', 'Created test at ' + testPath);
          fs.createReadStream(capturePath).pipe(fs.createWriteStream(testPath));
          spooky.emit('carahue.capture.complete');
        }
      });
    });
  }

  function diffFile(name, testPath, capturePath) {
    resemble.resemble(testPath)
        .compareTo(capturePath)
        .ignoreAntialiasing()
        .onComplete(function(data) {
          if (parseFloat(data.misMatchPercentage) >= 0.05) {
            var failPath = path.join(context.failurePath, name) + '.fail.png',
                expectedPath = path.join(context.failurePath, name) + '.expected.png',
                diffPath = path.join(context.failurePath, name) + '.diff.png';

            fs.createReadStream(capturePath).pipe(fs.createWriteStream(failPath));
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
