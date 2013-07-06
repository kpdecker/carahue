describe('screenshot', function() {
  beforePage(function() {
    this.thenScreenshot('before-page');
  });

  page('screenshot', __dirname + '/index.html');
});
