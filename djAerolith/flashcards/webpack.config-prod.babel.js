/* eslint-disable import/no-extraneous-dependencies */
/* Use for production build. Minifies, etc. */
import path from 'path';
// use import here instead of require, as require adds a 'default' key.
import webpackDev from './webpack.config.babel';

const webpack = require('webpack');
const _ = require('underscore');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const prodConfig = _.defaults({
  mode: 'production',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '../static/dist/'),
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
    // For flashcards app:
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, '../static/dist/templates/flashcards_dynamic/flashcards_include.html'),
      inject: false,
      template: path.resolve(__dirname, 'flashcards_include_template.html'),
    }),
  ],
  optimization: {
    moduleIds: 'deterministic',
    minimizer: [new TerserWebpackPlugin({
      parallel: true,
    })],
    splitChunks: {
      cacheGroups: {
        node_vendors: {
          test: /[\\/]node_modules[\\/]/, // is backslash for windows?
          chunks: 'all',
          priority: 1,
          name: 'vendors',
        },
      },
    },
  },
}, webpackDev);

export default prodConfig;
