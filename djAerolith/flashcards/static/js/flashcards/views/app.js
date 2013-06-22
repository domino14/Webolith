define([
  'backbone',
  'jquery',
  'mustache'
], function(Backbone, $, Mustache) {
  "use strict";
  var App, API_URL, SCHEDULED_URL;
  API_URL = '/cards/api/load';
  SCHEDULED_URL = '/cards/api/scheduled';
  App = Backbone.View.extend({
    initialize: function(options) {
      this.numCards = options.numCards;
    },
    events: {
      'click #load-prob': 'loadByProbability'
    },
    render: function() {
      this.$('#app-header').html(Mustache.render('You have {{numCards}} cards', {
        numCards: this.numCards
      }));
    },
    loadByProbability: function() {
      var min, max, length, lex;
      min = $('#prob-low').val();
      max = $('#prob-high').val();
      length = $('#word-length').val();
      lex = $('#lexicon').val();
      $.post(API_URL, JSON.stringify({
        min: min,
        max: max,
        length: length,
        lex: lex
      }), function(data) {
        console.log(data);
      }, 'json');
    },
    getScheduledCards: function() {
      $.get(SCHEDULED_URL, function(data) {
        console.log(data);
      }, 'json');
    }
  });
  return App;
});