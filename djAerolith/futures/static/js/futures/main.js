/* global requirejs,define*/
requirejs.config({
  baseUrl: '/static/js/futures',
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.10.1',
    underscore: '../../../../static/lib/underscore-1.4.4',
    backbone: '../../../../static/lib/backbone-1.0.0',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap'
  },
  shim: {
    underscore: {
      exports: '_'  // ^_^
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.tooltip'
    }
  }
});


define([
  'module',
  'jquery',
  'underscore',
  'backbone',
  'views/app',
  'app_router',
  'csrfAjax'
], function (module, $, _, Backbone, App, Router) {
  "use strict";
  $(function() {
    var app, router;
    router = new Router();
    Backbone.history.start({
      root: '/futures'
    });
    app = new App({
      categories: JSON.parse(module.config().categories),
      el: $('#app-view')
    });
    // Set up router events.
    router.on('route:categoryDetail', _.bind(app.loadCategory, app));
    // Navigate to any existing hash.
    router.navigate(location.hash, {trigger: true});
  });
});