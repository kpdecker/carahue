require('./lib/setup');

describe('issues', function() {
  page('issues', 'issues', function() {
    this
      .thenClick('.tabs a:not(.selected)')
      .thenScreenshot('tabs', '.tabs');
  });

  page('milestones', 'issues/milestones', {selector: '.repository-content'});
});
