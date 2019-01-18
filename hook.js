const fs = require('fs');
const path = require('path');

const merge = require('webpack-merge');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (context) => {
  // create index of existing decks
  fs.writeFileSync('./src/assets/decks/index.json', JSON.stringify(fs.readdirSync('./src/assets/decks')), 'utf-8');

  const {
    ConfigParser,
    CordovaLogger,
  } = context.requireCordovaModule('cordova-common');

  const {
    projectRoot
  } = context.opts;
  const {
    release
  } = context.opts.options;
  const mode = release ? 'production' : 'development';

  const cordovaConfig = new ConfigParser(path.join(projectRoot, 'config.xml'));
  const webpackConfigPath = path.resolve(projectRoot, cordovaConfig.getPreference('webpack-config') || 'webpack.config.js');
  const webpackConfigDefaults = {
    mode,
    devtool: release ? false : 'inline-source-map',
  };
  const webpackConfigOverrides = {
    output: {
      path: path.join(projectRoot, 'www'),
    },
    plugins: [
      new webpack.ProgressPlugin(),
    ],
  };
  let webpackConfig;
  if (fs.existsSync(webpackConfigPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    webpackConfig = require(webpackConfigPath);
    if (webpackConfig instanceof Function) {
      webpackConfig = webpackConfig(undefined, {
        cordova: context,
        mode,
      });
    }
  } else {
    webpackConfig = {
      devtool: ' eval-source-map',
      entry: './src/index.js',
      devServer: {
        port: 8080,
        contentBase: path.join(__dirname, "dist")
      },
      node: {
        fs: 'empty'
      },
      module: {
        rules: [{
            test: /\.ejs$/,
            loader: 'compile-ejs-loader'
          }, {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
          },
          {
            test: /\.(scss|css)$/,
            use: [{
                // creates style nodes from JS strings
                loader: 'style-loader',
                options: {
                  sourceMap: true
                }
              },
              {
                // translates CSS into CommonJS
                loader: 'css-loader',
                options: {
                  sourceMap: true
                }
              },
              {
                // compiles Sass to CSS
                loader: 'sass-loader',
                options: {
                  outputStyle: 'expanded',
                  sourceMap: true,
                  sourceMapContents: true
                }
              }
              // Please note we are not running postcss here
            ]
          },
          {
            test: /\.(mp4)$/,
            use: [{
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]'
              },
            }, ],
          },
          {
            // Load all images as base64 encoding if they are smaller than 8192 bytes
            test: /\.(png|jpg|gif)$/,
            use: [{
              loader: 'url-loader',
              options: {
                // On development we want to see where the file is coming from, hence we preserve the [path]
                name: '[path][name].[ext]',
                limit: 8192
              }
            }]
          }
        ],
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: 'src/index.ejs'
        }),
        new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery"
        })
      ],
      resolve: {
        alias: {
          'ejs': 'ejs/ejs.js'
        }
      }
    };
  }

  webpackConfig = merge(webpackConfigDefaults, webpackConfig, webpackConfigOverrides);

  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      CordovaLogger.get().log(CordovaLogger.INFO, stats.toString({
        colors: true,
      }));
      resolve();
    });
  });
};
