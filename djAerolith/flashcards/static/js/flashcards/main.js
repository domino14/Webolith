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
    json2: '../../../../static/js/aerolith/json2'
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
    }
  }
});


define([
  'module',
  'jquery',
  'underscore',
  'backbone',
  'views/app',
  'router',
  'csrfAjax',
  'bootstrap'
], function (module, $, _, Backbone, App, Router) {
  "use strict";
  var router, app;
  location.hash = '';
  app = new App({
    el: $('#app-view'),
    numCards: module.config().numCards
  });

  router = new Router();
  Backbone.history.start({
    root: '/cards'
  });
  router.on('route:newQuiz', _.bind(app.newQuiz, app));
  router.on('route:continueQuiz', _.bind(app.continueQuiz, app));
  app.on('quizStarted', function() {
    // Navigate to the 'continueQuiz' path, but don't trigger.
    router.navigate('quiz');
  });
});