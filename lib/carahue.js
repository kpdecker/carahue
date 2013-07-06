var _ = require('underscore'),
    context = require('./context'),
    Spooky = require('./spooky'),
    temp = require('temp');

var inited;


global.beforePage = function(fn) {
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

global.page = function(name, page, fn) {
  if (!inited) {
    inited = true;
    before(function(done) {
      Spooky.get(function() {
        // Need this indirection to prevent param passing to mocha
        done();
      });
    });
    before(function(done) {
      var self = this;

      temp.mkdir('carahue', function(err, dir) {
        if (err) {
          throw err;
        }
        self.tmpDir = dir;
        done();
      });
    });
  }

  it(name, function(done) {
    var self = this;

    start = Date.now();

    Spooky.get(function(spooky) {
      context.inject(self, spooky);

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
        before.call(self);
      });

      self.thenScreenshot(name);

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
