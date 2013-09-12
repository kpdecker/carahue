# Carahue

Carahue integrates [Mocha][], [SpookyJS][], and [node-resemble][] for automated layout and render testing of web-based projects.

```javascript
describe('checkout', function() {
  page('signin', 'signin', function() {
    this
      .thenClick('.continue')
      .thenScreenshot('errors', '.info-header');
  });
});
```

## BDD

Carahue extends the Mocha BDD API with the `page` and `beforePage` helpers. These may be used in conjuntion with normal Mocha BDD directives but the Carahue context is only available within these methods.

### #page(name, route[, options, callback])

Defines a Carahue test.

- `name` Name of the test
- `route` Route/URL to execute the test. This is relative to `routePrefix`, if defined.
- `options` Optional hash object with additional test options.
  - `before` Callback executed before the screenshot but after all `beforePage` instances
  - `selector` Selector to use when taking screenshot. Defaults to the entire page.
  - `ignore` Elements to ignore when taking screenshots. This value is applied in addition to `globalIgnore`
  - `after` Callback to execute after the initial screenshot.
- `callback` Callback to execute after the initial screenshot. May be used to define additional tests. Superceeds `options.after`.

See [Context](#context) for discussion of the APIs available in the callback.

### #beforePage(callback)

Called before each `page` test. Allows for test setup after the page has loaded, but before any screenshots have been taken.

See [Context](#context) for discussion of the APIs available in the callback.

## Context

All callbacks in `page` and `beforePage` methods are run in the Carahue context. By default the context includes

- `thenCheck(query, check)` Applies/removes the `checked` attribute for elements matching `query`
- `thenWaitForImages()` Pauses test execution until all images in the DOM have been loaded
- `thenScreenshot(name[, selector, ignore])` Takes a screenshot of the current page state
  - `name` Name of the screenshot. This will be used to generate the output file name.
  - `selector` Optional selector to limit the screenshot to
  - `ignore` Optional list of elements to remove from the screenshot

Additionally the following Spooky methods are exposed on the context:
- `then`
- `thenClick`
- `thenEvaluate`
- `thenOpen`
- `thenOpenAndEvaluate`

Discussion of these methods and the call structures can be found in the [Spooky documentation][].

### Extending Context

The execution context may be extended using the `carahue.context.extend(object)` method.

```javascript
carahue.context.extend({
  thenViewScreenshot: function(name) {
    return this.thenScreenshot(name, '[data-layout-cid]');
  }
});
```

Any fields exposed on the `object` parameter will be applied to future contexts.

## Configuration

Configuration may be set via the `carahue.config.extend(object)` method, which will augment the config with the passed object value.

```javascript
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
```javascript
    {
      'ignore-ssl-errors': 'yes',
      'web-security': 'false'
    }
```

  Is augmented rather than replaced when passed to `extend`.

- `casper` : Casper runtime options

  Defaults to
```javascript
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



## Testing

Carahue's internal tests may be run via

```sh
  grunt test
```

[Mocha]: http://visionmedia.github.io/mocha/
[SpookyJS]: https://github.com/WaterfallEngineering/SpookyJS
[node-resemble]: https://github.com/kpdecker/node-resemble
[Spooky documentation]: https://github.com/WaterfallEngineering/SpookyJS/wiki/Introduction
