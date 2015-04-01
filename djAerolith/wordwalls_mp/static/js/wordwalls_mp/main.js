/* global requirejs,define,mixpanel */
requirejs.config({
  baseUrl: '/static/js/wordwalls_mp',
  /*
   * Due to Django's style of having static directories per app, and because
   * our libs live in the djAerolith/static directory, we must append this
   * ugly path to every library file in order for the optimizer (r.js) to
   * work properly.
   */
  paths: {
    jquery: '../../../../static/js/aerolith/jquery-1.11.2',
    bootstrap: '../../../../static/lib/bootstrap/js/bootstrap',
    underscore: '../../../../static/lib/underscore-1.8.2',
    csrfAjax: '../../../../static/js/aerolith/csrfAjax',
    mustache: '../../../../static/lib/mustache',
    text: '../../../../static/lib/require/text',
    backbone: '../../../../static/lib/backbone-1.1.2',
    d3: '../../../../static/lib/d3.v3',
    firebase: '../../../../static/lib/firebase-2.2.1',
    // Models from wordwalls.
    alphagram: '../../../../static/js/wordwalls/models/alphagram',
    word: '../../../../static/js/wordwalls/models/word',
    configureModel: '../../../../static/js/wordwalls/models/configure'
  },
  shim: {
    bootstrap: {
      deps: ['jquery'],
      exports: '$.fn.tab'
    },
    firebase: {
      exports: 'Firebase'
    }
  }
});

define([
  'module',
  'jquery',
  'views/app',
  'bootstrap',
  'csrfAjax'
], function (module, $, App) {
  "use strict";
  $(function() {
    var app;
    app = new App({
      firebaseToken: module.config().firebaseToken,
      firebaseURL: module.config().firebaseURL
    });
  });
});
