define([
  'backbone',
  'underscore',
  'jquery',
  'mustache',
  'views/quiz',
  'text!templates/new_quiz.html'
], function(Backbone, _, $, Mustache, Quiz, NewQuizTemplate) {
  "use strict";
  var App, NEW_QUIZ_URL, SCHEDULED_URL;
  NEW_QUIZ_URL = '/cards/api/new_quiz';
  SCHEDULED_URL = '/cards/api/scheduled';
  App = Backbone.View.extend({
    initialize: function(options) {
      this.numCards = options.numCards;
      this.quiz = new Quiz({
        el: $('#card-area')
      });
    },
    events: {
      'click #load-prob': 'loadByProbability'
    },
    /**
     * Loads a new quiz by probability.
     */
    loadByProbability: function() {
      var min, max, length, lex;
      min = $('#prob-low').val();
      max = $('#prob-high').val();
      length = $('#word-length').val();
      lex = $('#lexicon').val();
      $.post(NEW_QUIZ_URL, JSON.stringify({
        min: min,
        max: max,
        length: length,
        lex: lex
      }), _.bind(function(questions) {
        this.quiz.reset(questions);
        this.$('#card-setup').empty();
      }, this), 'json');
    },
    getScheduledCards: function() {
      $.get(SCHEDULED_URL, function(data) {
      }, 'json');
    },
    newQuiz: function() {
      this.$('#card-setup').html(Mustache.render(NewQuizTemplate, {}));
    }
  });
  return App;
});