var async = require('async'),
    context = require('../lib/context'),
    fs = require('fs'),
    resemble = require('resemble'),
    sinon = require('sinon');

describe('context', function() {
  var passed,
      spooky,

      $impl;
  beforeEach(function() {
    passed = {
      screencapturePath: 'cap!',
      failurePath: 'fail!',

      test: {
        parent: {
          title: 'parent!'
        },
        title: 'title!'
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
      thenEvaluate: function(callback, arg1) {
        callback(arg1.query, arg1.check);
      },
      evaluate: function(callback) {
        return callback();
      },
      waitFor: this.spy(function(callback) {
        return callback.call(this);
      }),
      getElementBounds: function() {
        return {width: 1, height: 1};
      },
      captureBase64: this.spy(function() {
        return 'data';
      })
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
    it('should handle no images', function() {
      passed.thenWaitForImages();
      spooky.waitFor.should.have.been.calledOnce;
      spooky.waitFor.should.have.returned(true);
      global.document.querySelectorAll.should.have.been.calledWith('img');
    });
    it('should handle no images', function() {
      var imgs = [{complete: false}];
      global.document.querySelectorAll = this.spy(function() {
        return imgs;
      });

      passed.thenWaitForImages();
      spooky.waitFor.should.have.been.calledOnce;
      spooky.waitFor.should.have.returned(false);
      global.document.querySelectorAll.should.have.been.calledWith('img');

      spooky.waitFor.reset();
      imgs[0].complete = true;
      imgs.push({complete: false});

      passed.thenWaitForImages();
      spooky.waitFor.should.have.been.calledOnce;
      spooky.waitFor.should.have.returned(false);

      spooky.waitFor.reset();
      imgs[1].complete = true;

      passed.thenWaitForImages();
      spooky.waitFor.should.have.been.calledOnce;
      spooky.waitFor.should.have.returned(true);
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
      this.stub(fs, 'writeFile');
    });

    it('should call captureBase64', function() {
      passed.thenScreenshot('foo', 'bar');
      spooky.captureBase64.should.have.been.calledTwice;
      spooky.captureBase64.should.have.been.calledWith('PNG', 'bar');
    });
    it('should hide and show ignored elements', function() {
      passed.thenScreenshot('foo', 'bar', 'baz');
      spooky.captureBase64.should.have.been.calledTwice;
      $impl.css.should.have.been.calledWith('visibility', 'hidden');
      $impl.css.should.have.been.calledWith('visibility', '');
    });

    it('should create missing screenshot', function() {
      this.stub(fs, 'exists', function(path, callback) {
        callback(false);
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'parent!/title!-foo');
      spooky.on.withArgs('carahue.capture').args[0][1]('foo', 'baz');

      fs.writeFile.should.have.been.calledOnce;
      fs.writeFile.should.have.been.calledWith('cap!/foo.png');
    });

    it('should ignore matching screenshots', function() {
      this.stub(fs, 'exists', function(path, callback) {
        callback(true);
      });
      this.stub(fs, 'readFile', function(path, callback) {
        callback(undefined, 'foo');
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'parent!/title!-foo');
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
      this.stub(fs, 'readFile', function(path, callback) {
        callback(undefined, 'foo');
      });
      this.stub(async, 'parallel', function(steps, callback) {
        steps.forEach(function(step) {
          step();
        });
        callback();
      });

      passed.thenScreenshot('foo', 'bar');
      spooky.emit.should.have.been.calledWith('carahue.capture', 'parent!/title!-foo');
      spooky.on.withArgs('carahue.capture').args[0][1]('foo', 'baz');

      callback({
        misMatchPercentage: 1,
        getImageDataUrl: function() {
          return 'foo';
        }
      });

      fs.writeFile.should.have.been.calledThrice;
      fs.writeFile.should.have.been.calledWith('fail!/foo.expected.png');
      fs.writeFile.should.have.been.calledWith('fail!/foo.diff.png');
      fs.writeFile.should.have.been.calledWith('fail!/foo.fail.png');

      spooky.emit.should.not.have.been.calledWith('carahue.capture.complete', sinon.match(/Screenshot "parent!\/title!-foo" failed/));
    });

    it('should error on capture failure', function() {
      this.stub(process, 'nextTick', function(callback) { callback(); });

      passed.thenScreenshot('foo', 'bar');

      (function() {
        spooky.on.withArgs('carahue.capture').args[0][1]('foo');
      }).should.throw(/Failed to capture image: "foo"/);
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
