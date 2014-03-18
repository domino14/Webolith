/* global requirejs,define*/
requirejs.config({
  baseUrl: '/static/js/flashcards',
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.10.1',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap',
    underscore: '../../../../static/lib/underscore-1.4.4',
    backbone: '../../../../static/lib/backbone-1.0.0',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    json2: '../../../../static/js/aerolith/json2',
    tablesorter: '../../../../static/js/aerolith/jquery.tablesorter'
  },
  shim: {
    underscore: {
      exports: '_'  // ^_^
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
    },
    tablesorter: {
      deps: ['jquery'],
      exports: '$.fn.tablesorter'
    }
  }
});


define([
  'module',
  'jquery',
  'underscore',
  'backbone',
  'views/app',
  'csrfAjax',
  'bootstrap'
], function (module, $, _, Backbone, App) {
  "use strict";
  var app;
  app = new App({
    el: $('#app-view'),
    numCards: module.config().numCards,
    quizzes: JSON.parse(module.config().quizzes)
  });
});