var _ = require('underscore'),
    context = require('./context'),
    Mocha = require('mocha'),
    Spooky = require('./spooky'),
    temp = require('temp');

module.exports.config = require('./config');

// If we are run by global mocha, sniff for that case.
process.mainModule.children.forEach(function(child) {
  if (/mocha[\/\\]index.js/.test(child.filename)) {
    Mocha = child.exports;
  }
});

var loadFiles = Mocha.prototype.loadFiles;
Mocha.prototype.loadFiles = function() {
  if (!this.suite._carahueInit) {
    this.suite.beforeAll(function(done) {
      Spooky.get(function() {
        // Need this indirection to prevent param passing to mocha
        done();
      });
    });

    this.suite.beforeAll(function(done) {
      var self = this;

      temp.mkdir('carahue', function(err, dir) {
        if (err) {
          throw err;
        }
        self.tmpDir = dir;
        done();
      });
    });

    this.suite.on('pre-require', function(context) {
      context.beforePage = beforePage;
      context.page = page;
    });

    this.suite._carahueInit = true;
  }

  return loadFiles.apply(this);
};


function beforePage(fn) {
  before(function() {
    this.beforePage = this.beforePage || [];
    this.beforePage.push(fn);
  });
  after(function() {
    var index = _.lastIndexOf(this.beforePage, fn);
    if (index >= 0) {
      this.beforePage.splice(index, 1);
    }
  });
};

function page(name, page, fn) {
  it(name, function(done) {
    var self = this;

    start = Date.now();

    Spooky.get(function(spooky) {
      context.inject(self, spooky);

      if (self.routePrefix && !(/^\//.test(page) || /:\/\//.test(page))) {
        page = self.routePrefix + page;
      }

      function cleanup() {
        spooky.removeListener('carahue.done', onDone);
        spooky.removeListener('carahue.capture', onCapture);
        spooky.removeListener('carahue.capture.complete', onCaptureComplete);
      }

      function onDone(isDone) {
        self.done = self.done || isDone;

        if (!self.screencaptureCount && self.done) {
          cleanup();
          done();
        }
      }

      self.screencaptureCount = 0;
      self.done = false;
      function onCapture() {
        self.screencaptureCount++;
      }
      function onCaptureComplete() {
        self.screencaptureCount--;
        this.emit('carahue.done');
      }

      spooky.on('carahue.done', onDone);
      spooky.on('carahue.capture', onCapture);
      spooky.on('carahue.capture.complete', onCaptureComplete);

      spooky.start(page);
      _.each(self.beforePage, function(before) {
        before.call(self, name, page);
      });

      self.thenScreenshot('');

      try {
        fn && fn.call(self);
      } catch (err) {
        cleanup();

        throw err;
      }

      spooky.run(function() {
        this.emit('carahue.done', true);
      });
    });
  });
};
