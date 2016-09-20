/* global requirejs,define,JSON */
requirejs.config({
  baseUrl: '/static/js/wordwalls',
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.11.0',
    underscore: '../../../../static/lib/underscore-1.4.4',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    react: '../../../../static/lib/react',
    'react-dom': '../../../../static/lib/react-dom',
    jsx: '../../../../static/lib/jsx',
    babel: '../../../../static/lib/babel-5.8.34.min',
    immutable: '../../../../static/lib/immutable.min',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap'
  },
  shim: {
    underscore: {
      exports: '_'  // ^_^
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.tooltip'
    }
  },
  config: {
    babel: {
      sourceMaps: 'inline'
    }
  }
});


define([
  'module',
  'jquery',
  'jsx!reactapp/app',
  'csrfAjax',
  'bootstrap'
], function (module, $, App) {
  "use strict";
  $(function() {
    var app = new App();
    app.initialize({
      lexicon: module.config().lexicon,
      tablenum: module.config().tablenum,
      addlParams: JSON.parse(module.config().addlParams),
      username: module.config().username
    });
  });
});
