var _ = require('underscore'),
    Config = require('./config'),
    Spooky = require('spooky');

var spooky,
    callbackQueue = [];

module.exports = {
  isActive: function() {
    return !!spooky;
  },
  get: get,
  destroy: function() {
    if (spooky) {
      spooky.removeAllListeners();
      spooky.destroy();
      spooky = undefined;
    }
  }
};

process.on('exit', module.exports.destroy);

function get(callback) {
  if (!spooky) {
    callbackQueue.push(callback);

    spooky = Spooky.create(Config.get(), function (err) {
      if (err) {
        var e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
      }

      spooky.on('error', function (e) {
        module.exports.destroy();

        process.nextTick(function() {
          throw new Error(e.message || e);
        });
      });
      spooky.on('die', function(message) {
        module.exports.destroy();

        process.nextTick(function() {
          throw new Error(message);
        });
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
