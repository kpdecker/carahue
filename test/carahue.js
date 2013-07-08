var context = require('../lib/context'),
    EventEmitter = require('events').EventEmitter,
    Mocha,
    sinon = require('sinon'),
    Spooky = require('../lib/spooky');

// Use the mocha version that is running us to keep in sync with the hack that the impl
// does to bootstrap oursevles
process.mainModule.children.forEach(function(child) {
  if (/mocha[\/\\]index.js/.test(child.filename)) {
    Mocha = child.exports;
  }
});

require('../lib/carahue');

describe('carahue', function() {
  var spooky;
  beforeEach(function() {
    spooky = new EventEmitter();
    spooky.start = this.spy();
    spooky.run = function(callback) {
      callback.call(spooky);
    };
    this.stub(Spooky, 'get', function(callback) {
      callback(spooky);
    });
  });
  afterEach(function() {
    delete require.cache[__dirname + '/artifacts/screenshot.js'];
    delete require.cache[__dirname + '/artifacts/multiple.js'];
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
      screenshot.should.have.been.calledWith('');

      done();
    });
  });

  it('should handle route prefix', function(done) {
    var screenshot = this.spy();
    this.stub(context, 'inject', function(context) {
      context.thenScreenshot = screenshot;
    });

    var mocha = new Mocha();
    mocha.reporter(function() {});
    mocha.files = [__dirname + '/artifacts/route-prefix.js'];
    mocha.run(function() {
      spooky.start.should.have.been.calledWith(__dirname + '/artifacts/index.html');

      screenshot.should.have.been.calledOnce;
      screenshot.should.have.been.calledWith('');

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
      screenshot.should.have.been.calledWith('before-page', 'screenshot', sinon.match(/index.html/));
      screenshot.should.have.been.calledWith('');

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
      screenshot.should.have.been.calledWith('');
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
        count.should.equal(2);

        done();
      });

      function onDone() {
        if (count >= 2) {
          return;
        }

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
      screenshot.withArgs('').should.have.been.calledThrice;

      done();
    });
  });
});
