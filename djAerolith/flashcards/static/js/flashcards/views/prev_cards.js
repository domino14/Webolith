/**
 * @fileOverview This is a view for showing the "previous" cards of a quiz.
 */
define([
  'backbone',
  'underscore',
  'jquery',
  'mustache',
  'text!templates/previous_cards.html'
], function(Backbone, _, $, Mustache, PreviousCards) {
  "use strict";
  var NUM_PREV_CARDS = 10;
  return Backbone.View.extend({
    starHtml: function(numStars) {
      var i, html;
      html = '';
      for (i = 0; i < numStars; i++) {
        html += '<span class="glyphicon glyphicon-star">&#8199;</span>';
      }
      for (i = numStars; i < 5; i++) {
        html += '<span class="glyphicon glyphicon-star-empty">&#8199;</span>';
      }
      return html;
    },
    /**
     * Renders the previous cards view.
     * @param  {Backbone.Model} wordList An instance of the WordList model.
     */
    render: function() {
      var context, currentIndex, i, card, attrs, self, goneThruOnce;
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
      goneThruOnce = this.model.get('goneThruOnce');
      self = this;
      this.$('.stars').each(function() {
        var numStars = $(this).data('numStars');
        // Only show stars if they exist, and if we haven't already gone thru
        // quiz.
        if (numStars && !goneThruOnce) {
          $(this).html(self.starHtml(parseInt(numStars, 10))).addClass(
            numStars === 1 ? 'text-danger' : 'text-success');
        }
      });
      return this;
    }
  });
});
