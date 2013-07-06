var context = require('../lib/context'),
    Mocha = require('mocha'),
    Spooky = require('../lib/spooky');

require('../lib/carahue');

describe('carahue', function() {
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
    mocha.files = [__dirname + '/artifacts/screenshot.js'];
    mocha.run(function() {
      screenshot.should.have.been.calledOnce;
      screenshot.should.have.been.calledWith('screenshot');

      done();
    });
  });
  it('should execute beforePage steps');
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

  it('should wait for all screenshots to quit');
  it('should quit if all screenshots are complete');

  it('should support multiple tests in same exec');
});
