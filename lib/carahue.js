var _ = require('underscore'),
    context = require('./context'),
    Spooky = require('./spooky');

var inited;


global.page = function(name, page, options, fn) {
  if (!fn) {
    fn = options;
    options = {};
  }

  if (!inited) {
    inited = true;
    before(function(done) {
      Spooky.get(function() {
        // Need this indirection to prevent param passing to mocha
        done();
      });
    });
  }

  it(name, function(done) {
    var self = this;

    start = Date.now();

    Spooky.get(function(spooky) {
      context(self, spooky);

      spooky.on('carahue.done', function onConsole(line) {
        spooky.removeListener('carahue.done', onConsole);
        done();
      });

      spooky.start(page);
      self.thenScreenshot(name);

      spooky.run(function() {
        this.emit('carahue.done');
      });
    });
  });
};
