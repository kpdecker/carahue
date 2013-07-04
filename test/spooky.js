var Spooky = require('../lib/spooky'),
    SpookyLib = require('spooky');

describe('spooky wrapper', function() {
  afterEach(function() {
    Spooky.destroy();
  });

  it('should create spooky instance', function() {
    this.stub(SpookyLib, 'create');
    Spooky.get();
    SpookyLib.create.should.have.been.calledOnce;
  });
  it('should only call create once', function() {
    this.stub(SpookyLib, 'create', function() {
      return {
        destroy: function() {}
      };
    });

    Spooky.get();
    Spooky.get();
    SpookyLib.create.should.have.been.calledOnce;
  });

  it('should dispatch all callbacks', function() {
    var callback,
        spy = this.spy();
    this.stub(SpookyLib, 'create', function(options, _callback) {
      callback = _callback;
      return {
        on: function() {},
        destroy: function() {}
      };
    });

    Spooky.get(spy);
    Spooky.get(spy);
    callback();
    spy.should.have.been.calledTwice;

    Spooky.get(spy);
    spy.should.have.been.calledThrice;
  });

  it('should handle init errors', function() {
    this.stub(SpookyLib, 'create', function(options, callback) {
      callback('failed');
    });
    (function() {
      Spooky.get();
    }).should.throw(/Failed to initialize SpookyJS/);
  });

  it('should handle error events', function() {
    var callback;
    this.stub(SpookyLib, 'create', function(options, _callback) {
      callback = _callback;
      return {
        on: function(event, _callback) {
          if (event === 'error') {
            callback = _callback;
          }
        },
        destroy: function() {}
      };
    });

    Spooky.get();
    callback();

    (function() {
      callback('failed');
    }).should.throw(/failed/);
  });

  it('should handle log events', function() {
    var callback;
    this.stub(SpookyLib, 'create', function(options, _callback) {
      callback = _callback;
      return {
        on: function(event, _callback) {
          if (event === 'log') {
            callback = _callback;
          }
        },
        destroy: function() {}
      };
    });
    this.stub(console, 'log');

    Spooky.get();
    callback();

    var message = 'message!';
    message.space = 'remote';
    callback({
      space: 'remote',
      message: 'message!'
    });
    console.log.should.have.been.calledWith('message!');
  });
});
