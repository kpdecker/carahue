beforePage(function() {
  this.thenScreenshot('before-page');
});

describe('screenshot', function() {
  beforePage(function() {
    this.thenScreenshot('before-page2');
  });

  page('screenshot', __dirname + '/index.html');
  page('screenshot1', __dirname + '/index.html');
});

describe('screenshot2', function() {
  page('screenshot3', __dirname + '/index.html');
});
