/**
 * @fileOverview This has the quiz logic. Views should be dumb, but this
 * particular one is more than just a view. There's no direct quiz model
 * attached to this.
 */
define([
  'backbone',
  'underscore',
  'models/word_list',
  'mustache',
  'text!templates/card.html',
  'text!templates/card_front.html',
  'text!templates/card_back.html',
  'text!templates/card_info.html',
  'text!templates/quiz_header.html',
  'text!templates/alert.html'
], function(Backbone, _, WordList, Mustache, CardTemplate, CardFront,
  CardBack, CardInfo, QuizHeader, Alert) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {
      this.wordList = new WordList();
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
      'click #flip-card': 'flipCard',
      'click #sync': 'sync'
    },
    /**
     * Resets the quiz to a brand new array of questions.
     * @param {<Object>} wordList A representation of a WordList.
     * @param {Object} questionMap Maps question indices to definitions/words/
     *                             etc.
     * @param {string} quizName The name of the quiz.
     */
    reset: function(wordList, questionMap, quizName) {
      this.wordList.reset(wordList, questionMap, quizName);
      this.quizName = quizName;
      this.startQuiz();
    },
    /**
     * Loads quiz from localStorage.
     */
    loadFromStorage: function() {
      this.wordList.loadFromLocal();
      this.quizName = this.wordList.get('name');
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
      currentCard = this.wordList.currentCard();
      if (!currentCard) {
        this.showQuizOver();
        return;
      }
      this.viewingFront = true;
      this.renderCard(CardFront, currentCard);
      this.renderCardInfo();
      this.wordList.saveStateLocal();
    },
    /**
     * Shows the back of the card.
     */
    showCardBack: function() {
      var currentCard;
      currentCard = this.wordList.currentCard();
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
      attributes.cardNum = this.wordList.currentIndex() + 1;
      attributes.cardCount = this.wordList.numCards();
      return attributes;
    },
    /**
     * Mark the current card correct.
     */
    markCorrect: function() {
      this.wordList.markCurrentMissed(false);
      this.advanceCard();
    },
    /**
     * Mark missed.
     */
    markMissed: function() {
      this.wordList.markCurrentMissed(true);
      this.advanceCard();
    },
    /**
     * Advance to the next card.
     */
    advanceCard: function() {
      this.wordList.advanceCard();
      this.showCurrentCard();
    },
    /**
     * Show previous card.
     */
    previousCard: function() {
      this.wordList.previousCard();
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
      this.wordList.endQuiz();
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
     * Saves quiz info to remote server. Can fail.
     */
    sync: function() {

    }
  });
});