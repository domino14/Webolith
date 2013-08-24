define([
  'backbone',
  'underscore',
  'collections/cards',
  'mustache',
  'text!templates/card.html',
  'text!templates/card_front.html',
  'text!templates/card_back.html',
  'text!templates/card_info.html',
  'text!templates/quiz_header.html',
  'text!templates/alert.html'
], function(Backbone, _, Cards, Mustache, CardTemplate, CardFront, CardBack,
  CardInfo, QuizHeader, Alert) {
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
      this.quizInfo = this.$('#header-info');
      this.cardInfo = this.$('#footer-info');
      this.alertHolder = this.$('.alert-holder');
      this.quizOver = false;
      this.quizName = '';
      this.viewingFront = null;
    },
    events: {
      'click .solve': 'showCardBack',
      'click .correct': 'markCorrect',
      'click .missed': 'markMissed',
      'click #previous-card': 'previousCard',
      'click #flip-card': 'flipCard'
    },
    /**
     * Resets the quiz to an array of questions.
     * @param  {<Object>} questions An array of questions.
     */
    reset: function(questions, quizName) {
      this.cards.reset(_.shuffle(questions));
      this.quizName = quizName;
      this.curIndex = 0;
      this.startQuiz();
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
      this.quizName = localStorage.getItem('aerolith-cards-quizName');
      this.startQuiz();
    },
    /**
     * Starts quiz.
     */
    startQuiz: function() {
      this.quizOver = false;
      this.alertHolder.empty();
      this.showCurrentCard();
    },
    /**
     * Shows current card front.
     */
    showCurrentCard: function() {
      var currentCard;
      currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        this.showQuizOver();
        return;
      }
      this.viewingFront = true;
      this.renderCard(CardFront, currentCard);
      this.renderCardInfo();
      this.saveQuizInfo();
    },
    /**
     * Shows the back of the card.
     */
    showCardBack: function() {
      var currentCard;
      currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        return;
      }
      this.viewingFront = false;
      this.renderCard(CardBack, currentCard);
    },
    /**
     * Actually renders a card side with Mustache.
     * @param {string} template The template of the side of the card we
     *                          are rendering.
     * @param {Card} card The card.
     */
    renderCard: function(template, card) {
      var partials, attributes;
      attributes = this.getCardDisplayAttributes(card);
      partials = {'cardBody': template};
      this.card.html(Mustache.render(CardTemplate, attributes, partials));
    },
    /**
     * Gets the display attributes for a card. Used as a context for
     * rendering the card.
     * @param {Card} card
     * @return {Object}
     */
    getCardDisplayAttributes: function(card) {
      var attributes;
      attributes = card.toJSON();
      attributes.numAnswers = _.size(attributes.answers);
      attributes.pluralAnswers = attributes.numAnswers > 1;
      attributes.cardNum = this.curIndex + 1;
      attributes.cardCount = this.cards.size();
      return attributes;
    },
    /**
     * Mark the current card correct.
     */
    markCorrect: function() {
      var currentCard = this.cards.at(this.curIndex);
      if (!currentCard) {
        return;
      }
      currentCard.set('missed', false);
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
     * Flip card to front or back. Equivalent to clicking solve button when
     * viewing front.
     */
    flipCard: function() {
      if (this.viewingFront) {
        this.showCardBack();
      } else {
        this.showCurrentCard();
      }
    },
    /**
     * Render card information.
     */
    renderCardInfo: function() {
      this.cardInfo.html(Mustache.render(CardInfo, {}));
      this.quizInfo.html(Mustache.render(QuizHeader, {
        quizName: this.quizName
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
      this.renderAlert('The quiz is over!');
      this.quizOver = true;
    },
    /**
     * Renders an alert.
     * @param {string} alertText
     */
    renderAlert: function(alertText) {
      this.alertHolder.html(Mustache.render(Alert, {
        alert: alertText
      }));
    },
    /**
     * Saves quiz info to localstorage.
     */
    saveQuizInfo: function() {
      if (this.quizOver) {
        localStorage.removeItem('aerolith-cards-progress');
        localStorage.removeItem('aerolith-cards-currentIndex');
        localStorage.removeItem('aerolith-cards-quizName');
      } else {
        localStorage.setItem('aerolith-cards-currentIndex', this.curIndex);
        localStorage.setItem('aerolith-cards-progress',
          JSON.stringify(this.cards));
        localStorage.setItem('aerolith-cards-quizName', this.quizName);
      }
    }
  });
});