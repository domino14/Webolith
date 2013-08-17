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
      }), _.bind(this.startQuiz, this),
      'json').fail(_.bind(this.alertCallback, this));
    },
    getScheduledCards: function() {
      $.get(SCHEDULED_URL, function(data) {
      }, 'json');
    },
    alertCallback: function(jqXHR) {
      this.quiz.renderAlert(jqXHR.responseJSON);
    },
    newQuiz: function() {
      this.$('#card-setup').html(Mustache.render(NewQuizTemplate, {}));
    },
    continueQuiz: function() {
      this.quiz.loadFromStorage();
      this.$('#card-setup').empty();
    },
    /**
     * Starts quiz with data.
     * @param  {Object} data Object with a `questions` key.
     */
    startQuiz: function(data) {
      this.quiz.reset(data.questions, data.quiz_name);
      this.trigger('quizStarted');
      this.$('#card-setup').empty();
    }
  });
  return App;
});