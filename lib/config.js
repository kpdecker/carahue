var _ = require('underscore');

var config = {
  child: {
    'ignore-ssl-errors': 'yes',
    'web-security': 'false'
  },
  casper: {
    pageSettings: {
      userAgent: process.env.USER_AGENT
    },
    logLevel: 'info',
    verbose: true
  },
  screencapturePath: process.env.SCREENCAPTURE_PATH || undefined,
  failurePath: process.env.FAILURE_PATH || 'failure'
};

module.exports.extend = function(newConfig) {
  _.extend(config, _.omit(newConfig, 'child', 'casper'));
  if (newConfig.child) {
    _.extend(config.child, newConfig.child);
  }
  if (newConfig.casper) {
    _.extend(config.casper, newConfig.casper);
  }
};

module.exports.get = function() {
  return config;
};
