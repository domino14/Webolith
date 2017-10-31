/* global define, JSON */
define([
  'jquery',
  'underscore',
  'backbone',
  './views/app',
  './views/word_lookup',
  '../../../../static/js/aerolith/csrfAjax'
], function ($, _, Backbone, App, WordLookup) {
  "use strict";
  var app, wordLookup;
  require('bootstrap');
  app = new App({
    el: $('#app-view'),
    numCards: window.AppConfig.numCards,
    quizzes: JSON.parse(window.AppConfig.quizzes)
  });

  wordLookup = new WordLookup({
    el: $('#word-lookup-modal')
  });
});
