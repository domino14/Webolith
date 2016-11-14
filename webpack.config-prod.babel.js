/* eslint-disable import/no-extraneous-dependencies */
/* Use for production build. Minifies, etc. */
const webpack = require('webpack');

export default {
  output: {
    filename: 'table-client-bundle.js',
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
  entry: ['bootstrap-webpack',
    './djAerolith/wordwalls/static/js/wordwalls/reactapp/index'],
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
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
  ],
};
