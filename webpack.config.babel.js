/* eslint-disable import/no-extraneous-dependencies */
// Used for development build.
import path from 'path';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

export default {
  mode: 'development',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '/static/dist/',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx|es6)$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.es6'],
  },
  entry: {
    wordwallsapp: [
      '@babel/polyfill',
      'promise-polyfill',
      'whatwg-fetch',
      './djAerolith/wordwalls/static/js/wordwalls/index',
    ],
    flashcardsapp: [
      './djAerolith/flashcards/static/js/flashcards/main',
    ],
  },
  optimization: {
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
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new webpack.HashedModuleIdsPlugin(),
    new HtmlWebpackPlugin({
      // filename: path.resolve(__dirname, 'djAerolith/wordwalls/templates/wordwalls/include_scripts.html'),
      // filename: path.resolve(__dirname, 'djAerolith/static/dist/include_scripts.html'),
      inject: false,
      template: path.resolve(__dirname, 'djAerolith/wordwalls/templates/wordwalls/include_template.html'),
    }),
  ],
  devServer: {
    port: 7000,
    host: '0.0.0.0',
    public: 'vm.aerolith.org',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    disableHostCheck: true,
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 5000,
  },
};

// https://medium.com/@andyccs/webpack-and-docker-for-development-and-deployment-ae0e73243db4

