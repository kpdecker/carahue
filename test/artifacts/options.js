describe('screenshot', function() {
  page('page1', __dirname + '/index.html', 'ignore');
  page('page2', __dirname + '/index.html', {ignore: 'ignore2'});
});
