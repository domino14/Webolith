/* eslint-disable import/no-extraneous-dependencies */
// Used for development build.
const webpack = require('webpack');

export default {
  output: {
    filename: 'table-client-bundle.js',
    publicPath: '/static/dist/',
  },
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
      {
        test: /\.(woff|woff2)$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.ttf$/,
        loader: 'file-loader',
      },
      {
        test: /\.eot$/,
        loader: 'file-loader',
      },
      {
        test: /\.svg$/,
        loader: 'file-loader',
      },
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  entry: {
    vendor: [
      'bootstrap-webpack',
      'jquery',
      'react',
      'react-dom',
      'immutable',
      'underscore',
    ],
    app: './djAerolith/wordwalls/static/js/wordwalls/reactapp/index',
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jQuery',
      jQuery: 'jquery',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
    }),
  ],
};

