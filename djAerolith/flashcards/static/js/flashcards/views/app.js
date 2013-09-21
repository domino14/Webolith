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
      this.spinner = this.$('#card-spinner');
      this.listenTo(this.quiz, 'displaySpinner', _.bind(
        this.displaySpinner_, this));
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
      this.displaySpinner_(true);
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
      this.displaySpinner_(false);
      this.quiz.renderAlert(jqXHR.responseJSON);
    },
    newQuiz: function() {
      this.$('#card-setup').html(Mustache.render(NewQuizTemplate, {}));
      this.$('#card-area').hide();
    },
    continueQuiz: function() {
      this.quiz.loadFromStorage();
      this.$('#card-area').show();
      this.$('#card-setup').empty();
    },
    /**
     * Starts quiz with data.
     * @param  {Object} data Object with a `questions` key.
     */
    startQuiz: function(data) {
      this.displaySpinner_(false);
      this.quiz.reset(data.list, data.q_map, data.quiz_name);
      this.trigger('quizStarted');
      this.$('#card-setup').empty();
      this.$('#card-area').show();
    },
    /**
     * Displays (or hides) the spinner.
     * @param {boolean} display
     * @private
     */
    displaySpinner_: function(display) {
      if (display) {
        this.spinner.show();
      } else {
        this.spinner.hide();
      }
    }
  });
  return App;
});