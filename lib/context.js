var fs = require('fs'),
    path = require('path'),
    resemble = require('resemble');

module.exports.inject = function(context, spooky) {
  if (context.then) {
    return;
  }

  ['then', 'thenClick', 'thenEvaluate', 'thenOpen', 'thenOpenAndEvaluate'].forEach(function(name) {
    context[name] = function() {
      spooky[name].apply(spooky, arguments);
      return this;
    };
  });

  context.thenCheck = function(query, check) {
    spooky.thenEvaluate(function(query, check) {
      if (check) {
        $(query).attr('checked', check);
      } else {
        $(query).removeAttr('checked');
      }
    }, query, check !== false);
    return this;
  };

  context.thenWaitForImages = function() {
    spooky.then(function() {
      this.waitFor(function() {
        var images = document.querySelectorAll('img');
        return !images.length || !images.reduce(function(prev, curr) { return prev && curr.naturalWidth; }, true);
      });
    });
    return this;
  };

  context.thenScreenshot = function(name, selector, ignore) {
    if (ignore) {
      spooky.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', 'hidden');
      }, ignore);
    }

    if (name) {
      name = context.test.fullTitle() + '-' + name;
    } else {
      name = context.test.fullTitle();
    }

    var capturePath = path.join(context.tmpDir, name) + '.png';
    spooky.then([{name: name, capturePath: capturePath, selector: selector || 'body'}, function() {
      this.captureSelector(capturePath, selector);
      this.emit('carahue.capture', name, capturePath);
    }]);

    if (ignore) {
      spooky.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', '');
      }, ignore);
    }
    return this;
  };

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

            throw new Error('Screenshot "' + name + '" failed.\n  See: ' + diffPath);
          }

          spooky.emit('carahue.capture.complete');
        });
  }
};
