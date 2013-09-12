// NOTE: require('carahue') under normal environments
var carahue = require('../../');

carahue.config.extend({
  casper: {
    // Fake an iphone
    pageSettings: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'
    },
    viewportSize: {
      width: 320,
      height: 480
    },

    logLevel: 'debug',
    verbose: process.env.VERBOSE || false
  },

  // Location that test files will go
  screencapturePath: 'screenshots/',
  failurePath: 'failure/',

  // Test exec parameters
  routePrefix: 'https://github.com/kpdecker/carahue/',
  globalIgnore: '.js-relative-date'
});

carahue.context.extend({
  // Helper to take a screenshot of the primary view
  thenViewScreenshot: function(name) {
    return this.thenScreenshot(name, '.repository-content');
  },

  // Helper to wait for arbitrary input
  thenWaitForViewLoaded: function() {
    return this.then(function() {
      if (this.exists('.loading')) {
        this.waitWhileSelector('.loading', undefined, function() {
          this.die('Selector ".loading" never removed.');
        });
      }
    });
  }
});

// Before we take any screenshots, wait for the content to load.
beforePage(function() {
  this
    .thenWaitForViewLoaded()
    .thenWaitForImages();
});
