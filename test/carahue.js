var context = require('../lib/context'),
    Mocha = require('mocha'),
    SpookyLib = require('../lib/spooky');

require('../lib/carahue');

describe('carahue', function() {
  afterEach(function() {
    SpookyLib.destroy();
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
  it('should execute additional steps');

  it('should wait for all screenshots to quit');
  it('should quit if all screenshots are complete');

  it('should support multiple tests in same exec');
});
