/* eslint-disable import/no-extraneous-dependencies */
// Used for development build.
import path from 'path';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

export default {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../../static/dist/'),
    filename: '[name].js',
    publicPath: '/',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      wordvaultapp: path.resolve(__dirname, '../../frontend/src/'),
      wordwallsapp: path.resolve(__dirname, '../wordwalls/static/js/wordwalls/'),
      // For the legacy app, make "react" resolve to the flashcards
      // node_modules for consistent React usage.
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      jquery: path.resolve(__dirname, './node_modules/jquery'),
    },
  },
  entry: {
    flashcardsapp: ['./static/js/flashcards/main'],
  },
  optimization: {
    splitChunks: {
      name: (module, chunks, cacheGroupKey) => `${cacheGroupKey}~${chunks.map((c) => c.name).join('~')}`,
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
    // For flashcards app dev mode:
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, '../../static/dist/templates/flashcards_dynamic/flashcards_dev_include.html'),
      inject: false,
      template: path.resolve(__dirname, 'flashcards_include_template.html'),
    }),
  ],
  devServer: {
    port: 8089,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: ['aerolith.localhost'],
    hot: false,
    liveReload: false,
    client: false,
    static: false,
    devMiddleware: {
      publicPath: '/',
    },
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 5000,
  },
};
