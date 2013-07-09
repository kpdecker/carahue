# Carahue

## Configuration

Configuration may be updated via the `carahue.config.extend(object)` method, which will augment the config with the passed object value.

```
carahue.config.extend({
  casper: {
    viewportSize: {
      width: platform === 'ipad' ? 1024 : 320,
      height: platform === 'ipad' ? 768 : 480
    }
  }
});
```

Supported configuration values are:

- `child` : PhantomJS runtime options.

  Defaults to
```
    {
      'ignore-ssl-errors': 'yes',
      'web-security': 'false'
    }
```

  Is augmented rather than replaced when passed to `extend`.

- `casper` : Casper runtime options

  Defaults to
```
    {
      'pageSettings': {
        'userAgent': env.USER_AGENT
      },
      'logLevel': 'info',
      'verbose': true
    }
```

  Is augmented rather than replaced when passed to `extend`.

- `screencapturePath` : Path containing comparison screenshots.

  Defaults to `env.SCREENCAPTURE_PATH` or cwd

- `failurePath` : Path to output comparison images from failed tests to.

  Defaults to `env.FAILURE_PATH` or "failure"

- `routePrefix` : Prefix to apply to non-qualified routes.

  Defaults to empty.

- `globalIgnore` : Selector of elements that are always to be ignored when taking screenshots.

## Extending Context

The execution context may be extended using the `carahue.context.extend(object)` method.

```
carahue.context.extend({
  thenViewScreenshot: function(name) {
    return this.thenScreenshot(name, '[data-layout-cid]');
  }
});
```

Any fields exposed on the `object` parameter will be applied to future contexts.
