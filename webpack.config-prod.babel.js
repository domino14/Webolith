/* eslint-disable import/no-extraneous-dependencies */
/* Use for production build. Minifies, etc. */
// use import here instead of require, as require adds a 'default' key.
import webpackDev from './webpack.config.babel';

const webpack = require('webpack');
const _ = require('underscore');

const prodConfig = _.defaults(
  {
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jQuery',
        jQuery: 'jquery',
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        filename: 'vendor.js',
      }),
      new webpack.DefinePlugin({
        'process.env': {
          // For minifying React correctly.
          NODE_ENV: JSON.stringify('production'),
        },
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.optimize.AggressiveMergingPlugin(),
    ],
  }, webpackDev);

export default prodConfig;
