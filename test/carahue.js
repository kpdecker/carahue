var context = require('../lib/context'),
    EventEmitter = require('events').EventEmitter,
    Mocha = require('mocha'),
    Spooky = require('../lib/spooky');

require('../lib/carahue');

describe('carahue', function() {
  beforeEach(function() {
    var spooky = new EventEmitter();
    spooky.start = function() {};
    spooky.run = function(callback) {
      callback.call(spooky);
    };
    this.stub(Spooky, 'get', function(callback) {
      callback(spooky);
    });
  });
  afterEach(function() {
    delete require.cache[__dirname + '/artifacts/screenshot.js'];
    delete require.cache[__dirname + '/artifacts/additional-actions.js'];
  });
  after(function() {
    Spooky.destroy();
  });

  it('should take page screenshot', function(done) {
    var screenshot = this.spy();
    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha();
    mocha.reporter(function() {});
    mocha.files = [__dirname + '/artifacts/screenshot.js'];
    mocha.run(function() {
      screenshot.should.have.been.calledOnce;
      screenshot.should.have.been.calledWith('screenshot');

      done();
    });
  });
  it('should execute beforePage steps', function(done) {
    var screenshot = this.spy(function() {});

    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha();
    mocha.reporter(function(runner) {});
    mocha.files = [__dirname + '/artifacts/before-page.js'];
    mocha.run(function() {
      screenshot.should.have.been.calledTwice;
      screenshot.should.have.been.calledWith('before-page');
      screenshot.should.have.been.calledWith('screenshot');

      done();
    });
  });
  it('should execute additional steps', function(done) {
    var screenshot = this.spy(function() {});

    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha();
    mocha.reporter(function(runner) {});
    mocha.files = [__dirname + '/artifacts/additional-actions.js'];
    mocha.run(function() {
      screenshot.should.have.been.calledTwice;
      screenshot.should.have.been.calledWith('screenshot');
      screenshot.should.have.been.calledWith('foo', 'bar');

      done();
    });
  });
  it('should fail if additional steps throws', function(done) {
    var screenshot = this.spy(function() {});

    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha(),
        fail = this.spy(function(test, err) {
          test.title.should.equal('screenshot');
        });
    mocha.reporter(function(runner) {
      runner.on('fail', fail);
    });
    mocha.files = [__dirname + '/artifacts/additional-throws.js'];
    mocha.run(function() {
      fail.should.have.been.calledOnce;

      done();
    });
  });

  it('should wait for all screenshots to quit', function(done) {
    var self = this;
    Spooky.get(function(spooky) {
      var screenshot = self.spy(function() {
        spooky.emit('carahue.capture');
      });

      self.stub(context, 'inject', function(context) {
        context.thenScreenshot = screenshot;
      });

      var mocha = new Mocha(),
          count = 0;
      mocha.reporter(function(runner) {});
      mocha.files = [__dirname + '/artifacts/additional-actions.js'];
      mocha.run(function() {
        spooky.removeListener('carahue.done', onDone);

        screenshot.should.have.been.calledTwice;
        count.should.equal(3);

        done();
      });

      function onDone() {
        count++;
        process.nextTick(function() {
          spooky.emit('carahue.capture.complete');
        });
      }
      spooky.on('carahue.done', onDone);
    });
  });

  it('should support multiple tests in same exec', function(done) {
    var screenshot = this.spy(function() {});

    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha();
    mocha.reporter(function(runner) {});
    mocha.files = [__dirname + '/artifacts/multiple.js'];
    mocha.run(function() {
      screenshot.callCount.should.equal(8);

      screenshot.withArgs('before-page').should.have.been.calledThrice;
      screenshot.withArgs('before-page2').should.have.been.calledTwice;
      screenshot.should.have.been.calledWith('screenshot');
      screenshot.should.have.been.calledWith('screenshot1');
      screenshot.should.have.been.calledWith('screenshot3');

      done();
    });
  });
});
