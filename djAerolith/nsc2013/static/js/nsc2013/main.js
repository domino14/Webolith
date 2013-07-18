/* global requirejs,define*/
requirejs.config({
  baseUrl: '/static/js/nsc2013',
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.10.1',
    underscore: '../../../../static/lib/underscore-1.4.4',
    backbone: '../../../../static/lib/backbone-1.0.0',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap',
    moment: '../../../../static/lib/moment'
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
  'router',
  'csrfAjax'
], function (module, $, _, Backbone, App, Router) {
  "use strict";
  $(function() {
    var router, app;
    router = new Router();
    location.hash = '';
    Backbone.history.start({
      root: '/nsc2013'
    });
    app = new App({
      el: $('#yt')
    });
    // Set up router events.
    router.on('route:videoEmbed', _.bind(app.loadNewVideo, app));
  });
});