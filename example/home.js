require('./lib/setup');

describe('home', function() {
  page('home', '', {selector: '.bubble.readme'}, function() {
    this.thenScreenshot('footer', 'footer');
  });
});
