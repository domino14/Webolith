requirejs.config({
  baseUrl: '/static/js/crosswordgame',
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.10.1',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap',
    underscore: '../../../../static/lib/underscore-1.4.4',
    backbone: '../../../../static/lib/backbone-1.0.0',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    json2: '../../../../static/js/aerolith/json2',
    raphael: '../../../../static/js/aerolith/raphael-min'
  },
  shim: {
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ['underscore', 'jquery', 'json2'],
      exports: 'Backbone'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.collapse'
    },
    'json2': {
      exports: 'JSON'
    }
  }
});

define([
  'module',
  'jquery',
  'underscore',
  'backbone',
  'views/analyze',
  'bootstrap'
], function(module, $, _, Backbone, AnalyzeApp) {
  "use strict";
  $(document).ready(function() {
    var app;
    app = new AnalyzeApp({
      gcg: module.config().gamejson,
      el: $('#analysis-area')
    });

  });
});
