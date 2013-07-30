define([
  'backbone',
  'underscore',
  'collections/cards',
  'mustache',
  'text!templates/card_front.html',
  'text!templates/card_back.html',
  'text!templates/card_info.html'
], function(Backbone, _, Cards, Mustache, CardFront, CardBack, CardInfo) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {
      /**
       * A collection of `Card`s.
       * @type {Backbone.Collection}
       */
      this.cards = new Cards();
      /**
       * The current index that we are quizzing on in the cards collection.
       * @type {Number}
       */
      this.curIndex = 0;
      this.card = this.$('#card');
      this.cardInfo = this.$('#info');
    },
    events: {
      'click .solve': 'showCardBack',
      'click .correct': 'markCorrect',
      'click .missed': 'markMissed',
      'click #previous-card': 'previousCard'
    },
    /**
     * Resets the quiz to an array of questions.
     * @param  {<Object>} questions An object containing an array of questions.
     */
    reset: function(questions) {
      this.cards.reset(questions.questions);
      this.curIndex = 0;
      this.showCurrentCard();
    },
    /**
     * Shows current card front.
     */
    showCurrentCard: function() {
      var currentCard = this.cards.at(this.curIndex);
      this.card.html(Mustache.render(CardFront, currentCard.toJSON()));
      this.renderCardInfo();
    },
    /**
     * Shows the back of the card.
     */
    showCardBack: function() {
      var currentCard = this.cards.at(this.curIndex);
      this.card.html(Mustache.render(CardBack, currentCard.toJSON()));
    },
    /**
     * Mark the current card correct.
     */
    markCorrect: function() {
      var currentCard = this.cards.at(this.curIndex);
      this.advanceCard();
    },
    /**
     * Mark missed.
     */
    markMissed: function() {
      var currentCard = this.cards.at(this.curIndex);
      this.advanceCard();
    },
    /**
     * Advance to the next card.
     */
    advanceCard: function() {
      this.curIndex += 1;
      if (this.curIndex >= this.cards.size()) {
        // Out of bounds, quiz done.
        return;
      }
      this.showCurrentCard();
    },
    /**
     * Show previous card.
     */
    previousCard: function() {
      this.curIndex -= 1;
      if (this.curIndex < 0) {
        this.curIndex = 0;
      }
      this.showCurrentCard();
    },
    /**
     * Render card information.
     */
    renderCardInfo: function() {
      var numAnswers, plural;
      numAnswers = _.size(this.cards.at(this.curIndex).get('answers'));
      if (numAnswers > 1) {
        plural = 's';
      } else {
        plural = '';
      }
      this.cardInfo.html(Mustache.render(CardInfo, {
        cardNum: this.curIndex + 1,
        cardCount: this.cards.size(),
        numAnswers: numAnswers,
        plural: plural
      }));
    }
  });
});