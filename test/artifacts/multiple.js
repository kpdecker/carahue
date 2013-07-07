beforePage(function() {
  this.thenScreenshot('before-page');
});

describe('screenshot', function() {
  beforePage(function() {
    this.thenScreenshot('before-page2');
  });

  page('page1', __dirname + '/index.html');
  page('page2', __dirname + '/index.html');
});

describe('screenshot2', function() {
  page('page3', __dirname + '/index.html');
});
