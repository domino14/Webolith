define([
  'backbone',
  'underscore',
  'collections/quizzes',
  'mustache',
  'text!templates/quiz_selector.html',
  'models/word_list',
  'tablesorter'
], function(Backbone, _, Quizzes, Mustache, QuizSelectorTemplate, WordList) {
  "use strict";
  return Backbone.View.extend({
    initialize: function(options) {
      this.localList = new WordList();
      this.quizzes = new Quizzes();
      // Try loading a local WordList.
      this.localList.loadFromLocal();
      this.listenTo(this.quizzes, 'reset', _.bind(this.addAll, this));
      this.quizzes.reset(options.quizzes);
    },
    render: function() {
      var context;
      // Reload local wordlist.
      this.localList.loadFromLocal();
      context = {
        local: this.localList.toJSON(),
        quizzes: this.quizzes.toJSON()
      };
      this.$el.html(Mustache.render(QuizSelectorTemplate, context));
      // Sort descending on time.
      this.$('#quizzes-table').tablesorter({sortList: [[5,1]]});
    },
    addAll: function() {
      /*
       * Handle bug caused by wordwalls game where 'questionIndex' always
       * seems to be a multiple of 50 even if the quiz is done.
       */
      this.quizzes.each(function(quiz) {
        if (quiz.get('questionIndex') > quiz.get('numCurAlphagrams')) {
          quiz.set('questionIndex', quiz.get('numCurAlphagrams'));
        }
      });
      this.render();
    },
    /**
     * Remove the specific remote quiz from the displayed list.
     * @param {Number} quizId The id of the remote quiz to remove.
     */
    removeQuiz: function(quizId) {
      this.quizzes.remove(this.quizzes.get(quizId));
      this.render();
    },
    /**
     * Adds the word list to the remote quiz list. This is so that the
     * user doesn't have to refresh after finishing a quiz, to see the
     * most recently persisted quiz in the list.
     * @param {Object} wordList The word list.
     */
    addToRemotes: function(wordList) {
      var quiz = this.quizzes.get(wordList);
      if (!quiz) {
        this.quizzes.add(wordList);
      } else {
        quiz.set(wordList.toJSON());
      }
      this.render();
    }
  });
});