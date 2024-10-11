/* eslint-disable import/no-extraneous-dependencies */
// Used for development build.
import path from 'path';

const webpack = require('webpack');

export default {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'djAerolith/static/dist/'),
    filename: '[name].js',
    publicPath: '/static/dist/',
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
      wordvaultapp: path.resolve(__dirname, './frontend/src/'),
      wordwallsapp: path.resolve(__dirname, './djAerolith/wordwalls/static/js/wordwalls/'),
      // For the legacy app, make "react" resolve to a single
      // node_modules. This is important for hook usage. The "frontend"
      // directory, with a newer TS app + Vite, has its own React.
      // The legacy app imports some code from this frontend directory
      // (see "wordvaultapp" imports in the legacy app). We want
      // them to share the same React.
      react: path.resolve(__dirname, './node_modules/react'),
    },
    // alias: {
    //   // this alias is needed for the auto-generated RPC file import.
    //   './rpc/wordsearcher': path.resolve(
    //     __dirname,
    //     './djAerolith/wordwalls/static/js/wordwalls/gen/rpc/wordsearcher',
    //   ),
    // },
  },
  entry: {
    wordwallsapp: [
      '@babel/polyfill',
      'promise-polyfill',
      'whatwg-fetch',
      './djAerolith/wordwalls/static/js/wordwalls/index',
    ],
    flashcardsapp: ['./djAerolith/flashcards/static/js/flashcards/main'],
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
  ],
  devServer: {
    port: 7000,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: ['aerolith.localhost'],
    client: {
      webSocketURL: 'ws://aerolith.localhost/ws',
    },
  },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 5000,
  },
};

// https://medium.com/@andyccs/webpack-and-docker-for-development-and-deployment-ae0e73243db4
