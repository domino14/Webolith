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
    addAll: function() {
      var context;
      /*
       * Handle bug caused by wordwalls game where 'questionIndex' always
       * seems to be a multiple of 50 even if the quiz is done.
       */
      this.quizzes.each(function(quiz) {
        if (quiz.get('questionIndex') > quiz.get('numCurAlphagrams')) {
          quiz.set('questionIndex', quiz.get('numCurAlphagrams'));
        }
      });
      context = {
        local: this.localList.toJSON(),
        quizzes: this.quizzes.toJSON()
      };
      this.$el.html(Mustache.render(QuizSelectorTemplate, context));
      // Sort descending on time.
      this.$('#quizzes-table').tablesorter({sortList: [[4,1]]});
    },

  });
});