/* eslint-disable import/no-extraneous-dependencies */
/* Use for production build. Minifies, etc. */
import path from 'path';
// use import here instead of require, as require adds a 'default' key.
import webpackDev from './webpack.config.babel';

const webpack = require('webpack');
const _ = require('underscore');
const CompressionPlugin = require('compression-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const prodConfig = _.defaults({
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'djAerolith/static/dist/'),
    publicPath: '/static/dist/',
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jQuery',
      jQuery: 'jquery',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        // For minifying React correctly.
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new CompressionPlugin(),
    new webpack.HashedModuleIdsPlugin(),
  ],
  optimization: {
    minimizer: [new UglifyJsPlugin()],
    splitChunks: {
      cacheGroups: {
        node_vendors: {
          test: /[\\/]node_modules[\\/]/, // is backslash for windows?
          chunks: 'all',
          priority: 1,
        },
      },
    },
  },
}, webpackDev);

export default prodConfig;
