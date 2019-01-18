# cordova-webpack

> Automate Webpack for Cordova based projects

[![build status][travis-image]][travis-url]

## Installation

`cordova-webpack` can be installed using npm.

```sh
npm install cordova-webpack
```

## Usage

### Cordova configuration

Register the hook in *config.xml*.

```xml
<hook src="node_modules/cordova-webpack/hook.js" type="before_build" />
<hook src="node_modules/cordova-webpack/hook.js" type="before_emulate" />
<hook src="node_modules/cordova-webpack/hook.js" type="before_run" />
```

For more information, see [Cordova hooks].

This will use your Webpack configuration file to build your project in the *www* directory.

By default this will use *webpack.config.js*, but it can be configured using the preference `webpack-config` in *config.xml*. The value is a path to a configuration file relative to the project root.

```xml
<preference name="webpack-config" value="webpack.config.js" />
```

### Webpack configuration

Just like for the Webpack CLI, for this hook the configuration must expose a Webpack configuration object or a function which returns a Webpack configuration object.

Just like the Webpack CLI, if a function is exposed, it will be called with a webpack mode. Additionally the Cordova context is passed as `cordova`. `env` is always `undefined`.

```js
module.exports = (env, {
  mode,     // 'development' or 'production'
  cordova,  // Cordova context
}) => {
  // Return Webpack configuration
};
```

For a reference for the `cordova` object, see [Cordova hook context]

By default the `devtool` option is set to `false` for release builds, and `'inline-source-map'` for debug builds.

The output path is always set to *www* and the *ProgressPlugin* is always included.

[cordova hook context]: https://cordova.apache.org/docs/en/latest/guide/appdev/hooks#javascript
[cordova hooks]: https://cordova.apache.org/docs/en/latest/guide/appdev/hooks#introduction
[travis-image]: https://img.shields.io/travis/remcohaszing/cordova-webpack.svg
[travis-url]: https://travis-ci.org/remcohaszing/cordova-webpack
