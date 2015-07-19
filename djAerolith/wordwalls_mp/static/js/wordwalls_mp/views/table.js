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
      this.guessInput = this.$('.guess-text');
    },
    events: {
      'keypress .guess-text': 'readSpecialKeypress'
    },
    /**
     * Tries to get an event keycode in a browser-independent way.
     * @param  {Object} e The keypress event.
     * @return {number}   keyCode.
     */
    getKeyCode: function(e) {
      var charCode = e.which || e.keyCode;
      return charCode;
    },
    readSpecialKeypress: function(e) {
      var guessText, keyCode;
      guessText = this.guessInput.val();
      keyCode = this.getKeyCode(e);
      if (keyCode === 13 || keyCode === 32) {  // Return/Enter or Spacebar
        if (guessText.length < 1 || guessText.length > 15) {
          return;   // ignore
        }
        this.guessInput.val("");
        this.recordGuess(guessText);
      }
    },
    recordGuess: function(text) {
      this.questions.recordGuess(text);
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
      this.questions.setQuestions(questions);
    }
  });

  return Table;
});