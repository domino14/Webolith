/* global JSON*/
define([
  'backbone',
  'underscore',
  'jquery',
  'react',
  'react-dom',
  '../router',
  './quiz',
  './quiz_selector',
  './word_search_form.jsx'
], function(Backbone, _, $, React, ReactDOM, Router, Quiz,
  QuizSelector, WordSearchForm) {
  "use strict";
  var App, NEW_QUIZ_URL, SCHEDULED_URL;
  NEW_QUIZ_URL = '/cards/api/new_quiz';
  SCHEDULED_URL = '/cards/api/scheduled';
  App = Backbone.View.extend({
    initialize: function(options) {
      var router;
      this.numCards = options.numCards;
      this.quiz = new Quiz({
        el: $('#card-area')
      });
      this.quizSelector = new QuizSelector({
        el: $('#quiz-selector'),
        quizzes: options.quizzes
      });
      this.spinner = this.$('#card-spinner');
      this.listenTo(this.quiz, 'displaySpinner', _.bind(
        this.displaySpinner_, this));
      this.listenTo(this.quiz, 'removeQuiz', _.bind(
        this.quizSelector.removeQuiz, this.quizSelector));
      this.listenTo(this.quiz, 'listPersisted', _.bind(
        this.quizSelector.addToRemotes, this.quizSelector));
      // Set up router.
      location.hash = '';
      router = new Router();
      Backbone.history.start({
        root: '/cards'
      });
      router.on('route:newQuiz', _.bind(this.newQuiz, this));
      router.on('route:continueLocalQuiz', _.bind(this.continueQuiz, this));
      router.on('route:showQuizList', _.bind(this.showQuizList, this));
      router.on('route:remoteQuizAction', _.bind(this.loadRemoteQuiz, this));

      this.fixTableDropup();
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
    /**
     * Load a new quiz by a set of search criteria.
     */
    loadWords: function(criteria) {

      $.post(NEW_QUIZ_URL, JSON.stringify(criteria),
        _.bind(this.startQuiz, this), 'json').fail(
        _.bind(this.alertCallback, this));
    },

    // getScheduledCards: function() {
    //   $.get(SCHEDULED_URL, function(data) {
    //   }, 'json');
    // },
    alertCallback: function(jqXHR) {
      this.displaySpinner_(false);
      this.quiz.renderAlert(jqXHR.responseJSON);
    },
    newQuiz: function() {
      // Use default because this is an ES6 `default` export.
      ReactDOM.render(
        React.createElement(WordSearchForm['default'], {
          loadWords: _.bind(this.loadWords, this)
        }),
        document.getElementById('card-setup'));
      this.$('#card-setup').show();
      this.$('#card-area').hide();
      this.$('#quiz-selector').hide();
    },
    /**
     * Continue a local quiz.
     */
    continueQuiz: function() {
      this.quiz.loadFromStorage();
      this.showCardArea();
    },
    /**
     * Show the list of quizzes again and hide everything else.
     */
    showQuizList: function() {
      this.$('#quiz-selector').show();
      this.quizSelector.render();
      this.$('#card-area').hide();
      this.$('#card-setup').hide();
    },
    /**
     * Loads quiz from remote storage.
     * @param {string} action An action like 'continue'
     * @param {string} id The id of the quiz.
     */
    loadRemoteQuiz: function(action, id) {
      this.quiz.loadFromRemote(action, id);
      if (action !== 'delete') {
        this.showCardArea();
      }
    },
    /**
     * Show only card area.
     */
    showCardArea: function() {
      this.$('#card-area').show();
      ReactDOM.unmountComponentAtNode(
        document.getElementById('card-setup')
      );
      this.$('#card-setup').empty();
      this.$('#quiz-selector').hide();
    },
    /**
     * Starts quiz with data.
     * @param  {Object} data An object representing a word list.
     */
    startQuiz: function(data) {
      this.displaySpinner_(false);
      data.list.showInitialTags = data.showStars === 'true';
      this.quiz.reset(data.list, data.q_map, data.quiz_name);
      this.trigger('quizStarted');
      this.showCardArea();
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
    },
    fixTableDropup: function() {
      // Note: this function isn't perfect, but it'll do for now.
      // It was copied mostly from the wordwalls app.
      var $table = $('.table-responsive', this.$('#quiz-selector'));
      $('.quiz-mode-dropdown').on('shown.bs.dropdown', function checkDropdown() {
        // calculate the required sizes, spaces
        var $ul = $(this).children('.dropdown-menu');
        var $button = $(this).children('.dropdown-toggle');
        // Ugh, the position of the <tr>, plus the offset of the UL relative
        // to the dropdown toggle button.
        var ulOffsetTop = $ul.parents('.list-table-row').position().top +
          $ul.position().top;
        // how much space would be left on the top if the dropdown opened that
        // direction
        var spaceUp = ulOffsetTop - $button.height() - $ul.height();
        // how much space is left at the bottom
        var spaceDown = $table.height() - (ulOffsetTop + $ul.height());
        // switch to dropup only if there is no space at the bottom
        // AND there is space at the top, or there isn't either but it
        // would be still better fit
        if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) {
          $(this).addClass('dropup');
        }
      }).on('hidden.bs.dropdown', '.dropdown', function hhidden() {
        // always reset after close
        $(this).removeClass('dropup');
      });
    }
  });
  return App;
});
