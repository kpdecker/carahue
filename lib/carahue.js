var _ = require('underscore'),
    Spooky = require('spooky');

var inited,
    spooky,
    callbackQueue = [];


global.page = function(name, page, options, fn) {
  if (!fn) {
    fn = options;
    options = {};
  }

  if (!inited) {
    inited = true;
    before(function(done) {
      initSpooky(function() {
        // Need this indirection to prevent param passing to mocha
        done();
      });
    });
  }

  it(name, function(done) {
    start = Date.now();

    spooky.on('console', function onConsole(line) {
      if (line === 'carahue-done') {
        spooky.removeListener('console', onConsole);
        done();
      }
    });

    spooky.start(page);
    spooky.then([{name: name}, function() {
      this.captureSelector(name + '.png', 'body');
    }]);

    spooky.run(function() {
      this.echo('carahue-done');
    });
  });
};


initSpooky();
process.on('exit', function() {
  if (spooky) {
    spooky.destroy();
  }
});

function initSpooky(callback) {
  if (!spooky) {
    callbackQueue.push(callback);

    spooky = new Spooky({
      casper: {
        logLevel: 'debug',
        verbose: true
      }
    }, function (err) {
      if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
      }

      spooky.on('error', function (e) {
        throw new Error(e.message || e);
      });

      spooky.on('log', function (log) {
        if (log.space === 'remote') {
          console.log(log.message.replace(/ \- .*/, ''));
        }
      });

      _.each(callbackQueue, function(callback) {
        callback && callback(spooky);
      });
      callbackQueue.length = 0;
    });
  } else if (callbackQueue.length) {
    callbackQueue.push(callback);
  } else {
    callback && callback(spooky);
  }
}
