var _ = require('underscore'),
    context = require('./context'),
    Spooky = require('./spooky'),
    temp = require('temp');

var inited;



global.page = function(name, page, fn) {
  if (!inited) {
    inited = true;
    before(function(done) {
      Spooky.get(function() {
        // Need this indirection to prevent param passing to mocha
        done();
      });
    });
    before(function(done) {
      var self = this;

      temp.mkdir('carahue', function(err, dir) {
        if (err) {
          throw err;
        }
        self.tmpDir = dir;
        done();
      });
    });
  }

  it(name, function(done) {
    var self = this;

    start = Date.now();

    Spooky.get(function(spooky) {
      context(self, spooky);

      spooky.on('carahue.done', function onDone() {
        spooky.removeListener('carahue.done', onDone);
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
