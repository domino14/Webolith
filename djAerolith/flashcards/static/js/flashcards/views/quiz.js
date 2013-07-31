define([
  'backbone',
  'underscore',
  'collections/cards',
  'mustache',
  'text!templates/card_front.html',
  'text!templates/card_back.html',
  'text!templates/card_info.html',
  'text!templates/alert.html'
], function(Backbone, _, Cards, Mustache, CardFront, CardBack, CardInfo,
  Alert) {
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
      this.quizOver = false;
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
     * Loads quiz from localStorage.
     */
    loadFromStorage: function() {
      var progress, index;
      progress = localStorage.getItem('aerolith-cards-progress');
      index = localStorage.getItem('aerolith-cards-currentIndex');
      if (!progress) {
        return;
      }
      this.cards.reset(JSON.parse(progress));
      this.curIndex = parseInt(index, 10);
      this.showCurrentCard();
    },
    /**
     * Shows current card front.
     */
    showCurrentCard: function() {
      var currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        this.showQuizOver();
        return;
      }
      this.card.html(Mustache.render(CardFront, currentCard.toJSON()));
      this.renderCardInfo();
      this.saveQuizInfo();
    },
    /**
     * Shows the back of the card.
     */
    showCardBack: function() {
      var currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        return;
      }
      this.card.html(Mustache.render(CardBack, currentCard.toJSON()));
    },
    /**
     * Mark the current card correct.
     */
    markCorrect: function() {
      this.advanceCard();
    },
    /**
     * Mark missed.
     */
    markMissed: function() {
      var currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        return;
      }
      currentCard.set('missed', true);
      this.advanceCard();
    },
    /**
     * Advance to the next card.
     */
    advanceCard: function() {
      this.curIndex += 1;
      if (this.curIndex >= this.cards.size()) {
        // Out of bounds, quiz done.
        this.endQuiz();
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
    },
    /**
     * End the quiz. This will start quizzing on missed words typically.
     */
    endQuiz: function() {
      this.cards.reset(this.cards.where({missed: true}));
      this.cards.each(function(card) {
        card.set({missed: false});
      });
      this.curIndex = 0;
      this.showCurrentCard();
    },
    /**
     * Show the quiz is over final dialog.
     */
    showQuizOver: function() {
      this.$('.alert-holder').html(Mustache.render(Alert, {}));
      this.quizOver = true;
    },
    /**
     * Saves quiz info to localstorage.
     */
    saveQuizInfo: function() {
      if (this.quizOver) {
        localStorage.removeItem('aerolith-cards-progress');
        localStorage.removeItem('aerolith-cards-currentIndex');
      } else {
        localStorage.setItem('aerolith-cards-currentIndex', this.curIndex);
        localStorage.setItem('aerolith-cards-progress',
          JSON.stringify(this.cards));
      }
    }
  });
});