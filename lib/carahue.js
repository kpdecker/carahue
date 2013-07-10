var _ = require('underscore'),
    context = require('./context'),
    Mocha = require('mocha'),
    Spooky = require('./spooky');

module.exports.config = require('./config');
module.exports.context = require('./context');

// If we are run by global mocha, sniff for that case.
process.mainModule.children.forEach(function(child) {
  if (/mocha[\/\\]index.js/.test(child.filename)) {
    Mocha = child.exports;
  }
});

var loadFiles = Mocha.prototype.loadFiles,
    cleanupEvents = {};
Mocha.prototype.loadFiles = function() {
  if (!this.suite._carahueInit) {
    this.suite.beforeEach(function(done) {
      if (!Spooky.isActive()) {
        Spooky.get(function() {
          // Need this indirection to prevent param passing to mocha
          done();
        });
      } else {
        done();
      }
    });

    // Event listener cleanup
    this.suite.afterEach(function(done) {
      if (Spooky.isActive()) {
        Spooky.get(function(spooky) {
          _.each(cleanupEvents, function(handler, name) {
            spooky.removeListener(name, handler);
          });
          cleanupEvents = {};
          done();
        });
      } else {
        cleanupEvents = {};
        done();
      }
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
}

function page(name, page, options, fn) {
  if (_.isFunction(options)) {
    fn = options;
    options = undefined;
  }
  if (_.isString(options)) {
    options = {ignore: options};
  }

  it(name, function(done) {
    var self = this;

    start = Date.now();

    Spooky.get(function(spooky) {
      function register(name, fn) {
        spooky.on(name, fn);
        cleanupEvents[name] = fn;
      }

      context.inject(self, spooky);

      if (self.routePrefix && !(/^\//.test(page) || /:\/\//.test(page))) {
        page = self.routePrefix + page;
      }

      register('carahue.done', function(isDone) {
        self.done = self.done || isDone;

        if (!self.screencaptureCount && self.done) {
          done();
        }
      });

      self.screencaptureCount = 0;
      self.done = false;
      register('carahue.capture', function() {
        self.screencaptureCount++;
      });
      register('carahue.capture.complete', function() {
        self.screencaptureCount--;
        this.emit('carahue.done');
      });

      spooky.start(page);
      _.each(self.beforePage, function(before) {
        before.call(self, name, page);
      });

      self.thenScreenshot('', options && options.selector, options && options.ignore);

      fn && fn.call(self);

      spooky.run(function() {
        this.emit('carahue.done', true);
      });
    });
  });
}

page.skip = function(name) {
  it.skip(name);
};
