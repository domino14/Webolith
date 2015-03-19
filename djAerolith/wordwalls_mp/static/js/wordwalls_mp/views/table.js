/**
 * @fileOverview A view of a playing table. Contains subviews for questions,
 * player boxes, etc.
 */
define([
  'backbone',
  'views/questions'
], function(Backbone, Questions) {
  "use strict";
  var Table;
  Table = Backbone.View.extend({
    initialize: function() {
      this.questions = new Questions({
        el: this.$('svg.table-svg')
      });
      this.hide();
    },
    /**
     * Hides the element.
     */
    hide: function() {
      this.$el.hide();
    },
    /**
     * Shows the element.
     */
    show: function() {
      this.$el.show();
    },
    loadQuestions: function(questions) {
      this.questions.showQuestions(questions);
    }
  });

  return Table;
});