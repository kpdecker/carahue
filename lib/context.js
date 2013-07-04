module.exports = function(context, spooky, fn) {
  return function() {
    if (!context.then) {
      augmentContext(context, spooky);
    }
    return fn.call(context);
  };
};

function augmentContext(context, spooky) {
  ['then', 'thenClick', 'thenEvaluate', 'thenOpen', 'thenOpenAndEvaluate'].forEach(function(name) {
    context[name] = function() {
      spooky[name].apply(spooky, arguments);
      return this;
    };
  });

  context.thenCheck = function(query, check) {
    spooky.thenEvaluate(function(query, check) {
      if (check) {
        $(query).attr('checked', check);
      } else {
        $(query).removeAttr('checked');
      }
    }, query, check !== false);
    return this;
  };

  context.thenWaitForImages = function() {
    spooky.then(function() {
      this.waitFor(function() {
        var images = document.querySelectorAll('img');
        return !images.length || !images.reduce(function(prev, curr) { return prev && curr.naturalWidth; }, true);
      });
    });
    return this;
  };

  context.thenScreenshot = function(name, selector, ignore) {
    if (ignore) {
      spooky.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', 'hidden');
      }, ignore);
    }

    spooky.then([{name: name, selector: selector}, function(name, selector) {
      this.captureSelector(name + '.png', selector || 'body');
    }]);

    if (ignore) {
      spooky.thenEvaluate(function(ignore) {
        $(ignore).css('visibility', '');
      }, ignore);
    }
    return this;
  };
}
