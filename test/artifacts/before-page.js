describe('screenshot', function() {
  beforePage(function(name, page) {
    this.thenScreenshot('before-page', name, page);
  });

  page('screenshot', __dirname + '/index.html');
});
