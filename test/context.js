var context = require('../lib/context');

describe('context', function() {
  var passed,
      spooky,

      $impl;
  beforeEach(function() {
    passed = {};
    spooky = {
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
    context(passed, spooky);

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
    it('should call captureSelector', function() {
      passed.thenScreenshot('foo', 'bar');
      spooky.captureSelector.should.have.been.calledOnce;
    });
    it('should hide and show ignored elements', function() {
      passed.thenScreenshot('foo', 'bar', 'baz');
      spooky.captureSelector.should.have.been.calledOnce;
      $impl.css.should.have.been.calledWith('visibility', 'hidden');
      $impl.css.should.have.been.calledWith('visibility', '');
    });
  });
});
