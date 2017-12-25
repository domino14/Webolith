/* eslint-disable import/no-extraneous-dependencies */
// Used for development build.
const webpack = require('webpack');

export default {
  output: {
    filename: '[name].js',
    publicPath: 'http://localhost:7000/static/dist/',
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  entry: {
    vendor: [
      'bootstrap',
      'jquery',
      'underscore',
    ],
    wordwallsapp: [
      'babel-polyfill',
      'promise-polyfill',
      'whatwg-fetch',
      './djAerolith/wordwalls/static/js/wordwalls/index',
    ],
    flashcardsapp: './djAerolith/flashcards/static/js/flashcards/main',
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
    }),
  ],
  devServer: {
    port: 7000,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
};

