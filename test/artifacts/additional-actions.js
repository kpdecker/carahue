describe('screenshot', function() {
  page('screenshot', __dirname + '/index.html', function() {
    this.thenScreenshot('foo', 'bar');
  });
});
