var _ = require('underscore'),
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
    start = Date.now();

    Spooky.get(function(spooky) {
      spooky.on('carahue.done', function onConsole(line) {
        spooky.removeListener('carahue.done', onConsole);
        done();
      });

      spooky.start(page);
      spooky.then([{name: name}, function() {
        this.captureSelector(name + '.png', 'body');
      }]);

      spooky.run(function() {
        this.emit('carahue.done');
      });
    });
  });
};
