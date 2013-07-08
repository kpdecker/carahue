var context = require('../lib/context'),
    fs = require('fs'),
    resemble = require('resemble');

describe('context', function() {
  var passed,
      spooky,

      $impl;
  beforeEach(function() {
    passed = {
      screencapturePath: 'cap!',
      failurePath: 'fail!',

      test: {
        fullTitle: function() {
          return 'full title!';
        }
      }
    };
    spooky = {
      on: this.spy(),
      emit: this.spy(),
      thenClick: this.spy(),
      then: function(callback) {
        if (callback[1]) {
          callback = callback[1].bind(spooky, callback[0]);
        }

        callback.call(spooky);
      },
      thenEvaluate: function(callback, arg1, arg2) {
        callback(arg1, arg2);
      },
      waitFor: this.spy(function(callback) {
        return callback();
      }),
      captureSelector: this.spy()
    };
    context.inject(passed, spooky);

    $impl = {
      attr: this.spy(),
      removeAttr: this.spy(),
      css: this.spy()
    };
    global.$ = function() {
      return $impl;
    };
    global.document = {
      querySelectorAll: this.spy(function() {
        return [];
      })
    };
  });

  it('should augment passed object', function() {
    should.exist(passed.then);
    should.exist(passed.thenClick);
    should.exist(passed.thenEvaluate);
    should.exist(passed.thenOpen);
    should.exist(passed.thenOpenAndEvaluate);

    should.exist(passed.thenCheck);
    should.exist(passed.thenWaitForImages);

    should.exist(passed.thenScreenshot);
  });
  it('should not overwrite if called twice', function() {
    var then = passed.then;
    context.inject(passed, spooky);
    passed.then.should.equal(then);
  });

  it('should forward calls to spooky', function() {
    passed.thenClick('foo', 'bar');
    spooky.thenClick.should.have.been.calledOnce;
    spooky.thenClick.should.have.been.calledWith('foo', 'bar');
  });

  describe('#thenCheck', function() {
    it('should set checked state', function() {
      passed.thenCheck('foo', true);
      $impl.attr.should.have.been.calledWith('checked', true);

      passed.thenCheck('foo', false);
      $impl.removeAttr.should.have.been.calledWith('checked');
    });
  });

  describe('#thenWaitForImages', function() {
    it('should wait for images', function() {
      passed.thenWaitForImages();
      spooky.waitFor.should.have.been.calledOnce;
      spooky.waitFor.should.have.returned(true);
      global.document.querySelectorAll.should.have.been.calledWith('img');
    });
  });

  describe('#thenScreenshot', function() {
    var callback;

    beforeEach(function() {
      this.stub(resemble, 'resemble', function() {
        return {
          compareTo: function() { return this; },
          ignoreAntialiasing: function() { return this; },
          onComplete: function(_callback) {
            callback = _callback;
          }
        };
      });

      this.stub(fs, 'createReadStream', function() {
        return { pipe: function() {} };
      });
      this.stub(fs, 'createWriteStream');
    });

    it('should call captureSelector', function() {
      passed.thenScreenshot('foo', 'bar');
      spooky.captureSelector.should.have.been.calledOnce;
      spooky.captureSelector.should.have.been.calledWith('full-title!-foo.png');
    });
    it('should handle no title case', function() {
      passed.thenScreenshot(undefined, 'bar');
      spooky.captureSelector.should.have.been.calledOnce;
      spooky.captureSelector.should.have.been.calledWith('full-title!.png');
    });
    it('should hide and show ignored elements', function() {
      passed.thenScreenshot('foo', 'bar', 'baz');
      spooky.captureSelector.should.have.been.calledOnce;
      $impl.css.should.have.been.calledWith('visibility', 'hidden');
      $impl.css.should.have.been.calledWith('visibility', '');
    });

    it('should create missing screenshot', function() {
      this.stub(fs, 'exists', function(path, callback) {
        callback(false);
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'full-title!-foo');
      spooky.on.withArgs('carahue.capture').args[0][1]('foo', 'baz');

      fs.createReadStream.should.have.been.calledOnce;
      fs.createReadStream.should.have.been.calledWith('baz');

      fs.createWriteStream.should.have.been.calledOnce;
      fs.createWriteStream.should.have.been.calledWith('cap!/foo.png');
    });

    it('should ignore matching screenshots', function() {
      this.stub(fs, 'exists', function(path, callback) {
        callback(true);
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'full-title!-foo');
      spooky.on.withArgs('carahue.capture').args[0][1]('foo', 'baz');

      callback({
        misMatchPercentage: 0
      });
      spooky.emit.should.have.been.calledWith('carahue.capture.complete');
    });

    it('should output failing screenshots', function() {
      this.stub(fs, 'exists', function(path, callback) {
        callback(true);
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'full-title!-foo');
      spooky.on.withArgs('carahue.capture').args[0][1]('foo', 'baz');

      (function() {
        callback({
          misMatchPercentage: 1,
          pngStream: function() {
            return {
              pipe: function() {}
            };
          }
        });
      }).should.throw(/Screenshot "foo" failed./);

      fs.createWriteStream.should.have.been.calledThrice;
      fs.createWriteStream.should.have.been.calledWith('fail!/foo.fail.png');
      fs.createWriteStream.should.have.been.calledWith('fail!/foo.expected.png');
      fs.createWriteStream.should.have.been.calledWith('fail!/foo.diff.png');

      spooky.emit.should.not.have.been.calledWith('carahue.capture.complete');
    });
  });

  it('should extend context', function() {
    var extended = {};
    context.extend({
      'extended!': function() {
      }
    });
    context.inject(extended, spooky);
    should.exist(extended['extended!']);
  });
});
