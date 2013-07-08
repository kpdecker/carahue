var path = require('path');

describe('config', function() {
  before(function() {
    delete require.cache[path.resolve(__dirname + '/../lib/config.js')];
  });
  afterEach(function() {
    delete require.cache[path.resolve(__dirname + '/../lib/config.js')];
  });

  it('should load from environment values', function() {
    process.env.USER_AGENT = 'notIE';
    process.env.SCREENCAPTURE_PATH = 'screencapture!';
    process.env.FAILURE_PATH = 'failure!';

    var config = require('../lib/config').get();
    config.casper.pageSettings.should.eql({
      userAgent: 'notIE'
    });
    config.screencapturePath.should.equal('screencapture!');
    config.failurePath.should.equal('failure!');
  });
  it('should extend base config values', function() {
    var Config = require('../lib/config');
    Config.extend({foo: 'bar'});
    Config.get().foo.should.equal('bar');
  });
  it('should extend nested config values', function() {
    var Config = require('../lib/config');
    Config.extend({
      child: {
        foo: 'bar'
      },
      casper: {
        baz: 'bat',
        pageSettings: true
      }
    });
    Config.get().child.should.eql({
      'ignore-ssl-errors': 'yes',
      'web-security': 'false',
      foo: 'bar'
    });
    Config.get().casper.should.eql({
      pageSettings: true,
      logLevel: 'info',
      verbose: true,
      baz: 'bat'
    });
  });
});
