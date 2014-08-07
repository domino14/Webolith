/**
 * @fileOverview This is a view for showing the "previous" cards of a quiz.
 */
define([
  'backbone',
  'underscore',
  'mustache',
  'text!templates/previous_cards.html'
], function(Backbone, _, Mustache, PreviousCards) {
  "use strict";
  var NUM_PREV_CARDS = 10;
  return Backbone.View.extend({
    /**
     * Renders the previous cards view.
     * @param  {Backbone.Model} wordList An instance of the WordList model.
     */
    render: function() {
      var context, currentIndex, i, card, attrs;
      currentIndex = this.model.get('questionIndex');
      context = [];
      for (i = currentIndex - 1;
           i >= _.max([currentIndex - NUM_PREV_CARDS, 0]);
           i--) {
        card = this.model.cards.at(i);
        if (card) {
          attrs = card.attributes;
          attrs.numAnswers = attrs.answers.length;
          context.push(card.attributes);
        }
      }
      this.$el.html(Mustache.render(PreviousCards, {'cards': context}));
      return this;
    }
  });
});