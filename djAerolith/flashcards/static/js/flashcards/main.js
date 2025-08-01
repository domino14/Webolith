/* global define, JSON */
define([
  'jquery',
  'underscore',
  'backbone',
  './views/app',
  './views/word_lookup',
  './csrfAjax'
], function ($, _, Backbone, App, WordLookup) {
  "use strict";
  var app, wordLookup;
  require('bootstrap/dist/js/bootstrap');
  app = new App({
    el: $('#app-view'),
    numCards: window.AppConfig.numCards,
    quizzes: JSON.parse(window.AppConfig.quizzes)
  });

  wordLookup = new WordLookup({
    el: $('#word-lookup-modal')
  });
});
