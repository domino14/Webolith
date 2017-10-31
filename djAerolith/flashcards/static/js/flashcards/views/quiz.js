/**
 * @fileOverview This has the quiz logic. Views should be dumb, but this
 * particular one is more than just a view. There's no direct quiz model
 * attached to this.
 */
define([
  'backbone',
  'jquery',
  'underscore',
  '../models/word_list',
  './prev_cards',
  'mustache',
  'text-loader!../templates/card.html',
  'text-loader!../templates/card_front.html',
  'text-loader!../templates/card_back.html',
  'text-loader!../templates/card_info.html',
  'text-loader!../templates/quiz_header.html',
  'text-loader!../templates/save_success.html',
  'text-loader!../templates/alert.html'
], function(Backbone, $, _, WordList, PrevCards, Mustache, CardTemplate,
  CardFront, CardBack, CardInfo, QuizHeader, SaveSuccess, Alert) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {
      this.wordList = new WordList();
      this.listenTo(this.wordList, 'quizEnded', _.bind(this.quizEnded, this));
      this.listenTo(this.wordList, 'remoteListLoaded', _.bind(
        this.remoteListLoaded, this));
      this.listenTo(this.wordList, 'remoteListDeleted', _.bind(
        this.remoteListDeleted, this));
      this.card = this.$('#card');
      this.quizInfo = this.$('#header-info');
      this.cardInfo = this.$('#footer-info');
      this.alertHolder = $('.alert-holder');
      this.quizOver = false;
      this.quizName = '';
      this.viewingFront = null;
      this.prevCards = new PrevCards({
        el: this.$('#prev-card-info'),
        model: this.wordList
      });
    },
    events: {
      'click .solve': 'showCardBack',
      'click #previous-card': 'previousCard',
      'click #flip-card': 'flipCard',
      'click #sync': 'sync',
      'mouseover .startag': 'hoverStar',
      'click .startag': 'clickStar',
      'click .correct': 'markCorrectButton',
      'click .missed': 'markMissedButton'
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
     * Tells word list model to load from quiz. Asks for confirmation
     * for destructive actions.
     * @param {string} action The action, such as continue, first missed.
     * @param {string} id The id of the quiz.
     */
    loadFromRemote: function(action, id) {
      var sure, fail;
      // XXX: better confirm dialog.
      sure = window.confirm('You have selected ' + action + '. Are you sure?');
      if (!sure) {
        return;
      }
      this.trigger('displaySpinner', true);
      fail = function(jqXHR) {
        if (jqXHR.responseJSON) {
          this.renderAlert(jqXHR.responseJSON);
        } else {
          this.renderAlert([
            'Unable to perform action; perhaps you are not currently ',
            'connected to the Internet?'
          ].join(''));
        }
        this.trigger('displaySpinner', false);
      };
      /*
       * Don't pass a success callback to loadFromRemote. Instead wordList
       * should emit signals.
       */
      this.wordList.loadFromRemote(action, id, _.bind(fail, this));
    },
    /**
     * Called when a remote list is loaded; see note in loadFromRemote above.
     * Actually starts the quiz.
     */
    remoteListLoaded: function() {
      this.trigger('displaySpinner', false);
      this.quizName = this.wordList.get('name');
      this.startQuiz();
    },
    /**
     * Called when a remote list is deleted.
     * @param {Number} quizId The id of the quiz.
     */
    remoteListDeleted: function(quizId) {
      this.trigger('displaySpinner', false);
      this.trigger('removeQuiz', quizId);
    },
    /**
     * Starts quiz.
     */
    startQuiz: function() {
      this.quizOver = false;
      this.alertHolder.empty();
      this.showCurrentCard();
      this.prevCards.render();
    },
    /**
     * Shows current card front.
     */
    showCurrentCard: function() {
      var currentCard;
      currentCard = this.wordList.currentCard();
      if (!currentCard) {
        this.showQuizOver();
        this.renderCardInfo();
        return;
      }
      this.viewingFront = true;
      this.renderCard(CardFront, currentCard);
      this.renderCardInfo();
    },
    /**
     * Hover on a star. Show a caption/color the star.
     */
    hoverStar: function(event) {
      var numStars = parseInt($(event.target).data('stars'), 10);

      var captions = {
        1: 'I missed this word, even if I "knew" it',
        2: 'Solved, but don\'t know this word well at all',
        3: 'I know this word ok',
        4: 'I know this word pretty well',
        5: 'I know this word very well, should not quiz on it again'
      };
      this.$('.star-caption').html(captions[numStars]);
      this.renderStars(numStars);
    },
    /**
     * Render the number of stars with colors, etc.
     * @param  {number} numStars
     */
    renderStars: function(numStars) {
      var colorClass = 'text-danger';
      if (numStars > 1) {
        colorClass = 'text-success';
      }
      for (var i = 0; i < numStars; i++) {
        this.$('.star' + String(i+1)).addClass('glyphicon-star').removeClass(
          'glyphicon-star-empty');
      }
      for (i = numStars; i < 5; i++) {
        this.$('.star' + String(i+1)).addClass(
          'glyphicon-star-empty').removeClass('glyphicon-star');
      }
      this.$('.star-tags').removeClass('text-danger text-success').addClass(
        colorClass);
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
      if (this.wordList.get('goneThruOnce')) {
        this.$('.card-buttons').show();
        this.$('.initial-filter').hide();
      } else {
        this.$('.initial-filter').show();
        this.$('.card-buttons').hide();
      }
    },
    /**
     * Actually renders a card side with Mustache.
     * @param {string} template The template of the side of the card we
     *                          are rendering.
     * @param {Card} card The card.
     */
    renderCard: function(template, card) {
      var partials, attributes;
      attributes = this.getCardDisplayAttributes_(card);
      partials = {'cardBody': template};
      this.card.html(Mustache.render(CardTemplate, attributes, partials));
      // Render stars if applicable
      if (template === CardBack && attributes.stars) {
        this.renderStars(attributes.stars);
      }
    },
    /**
     * Gets the display attributes for a card. Used as a context for
     * rendering the card.
     * @param {Card} card
     * @return {Object}
     * @private
     */
    getCardDisplayAttributes_: function(card) {
      var attributes;
      attributes = card.toJSON();
      attributes.numAnswers = _.size(attributes.answers);
      attributes.pluralAnswers = attributes.numAnswers > 1;
      attributes.cardNum = this.wordList.currentIndex() + 1;
      attributes.cardCount = this.wordList.numCards();
      return attributes;
    },
    clickStar: function(event) {
      var numStars = parseInt($(event.target).data('stars'), 10);
      if (numStars > 1) {
        this.markCorrect(numStars);
      } else {
        this.markMissed(1);
      }
    },
    /**
     * Mark the current card correct.
     */
    markCorrect: function(numStars) {
      this.wordList.markCurrentMissed(false);
      if (numStars) {
        this.wordList.tagCurrent(numStars);
      }
      this.advanceCard();
    },

    markCorrectButton: function() {
      this.markCorrect();
    },
    /**
     * Mark missed.
     */
    markMissed: function(numStars) {
      this.wordList.markCurrentMissed(true);
      // 1 star for missed.
      if (numStars) {
        this.wordList.tagCurrent(numStars);
      }
      this.advanceCard();
    },
    markMissedButton: function() {
      this.markMissed();
    },
    /**
     * Advance to the next card.
     */
    advanceCard: function() {
      this.wordList.advanceCard();
      this.showCurrentCard();
      this.prevCards.render();
    },
    /**
     * Show previous card.
     */
    previousCard: function() {
      this.wordList.previousCard();
      this.showCurrentCard();
      this.prevCards.render();
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
      this.cardInfo.html(Mustache.render(CardInfo, {
        missed: _.size(this.wordList.get('missed')),
        total: _.size(this.wordList.get('curQuestions'))
      }));
      this.quizInfo.html(Mustache.render(QuizHeader, {
        quizName: this.quizName
      }));
    },
    /**
     * Gotten from wordList when the quiz has ended. Try to show current card.
     */
    quizEnded: function() {
      this.showCurrentCard();
    },
    /**
     * Show the quiz is over final dialog.
     */
    showQuizOver: function() {
      this.renderAlert('The quiz "' + this.quizName + '" is over!');
      this.quizOver = true;
    },
    /**
     * Renders an alert.
     * @param {string} alertText
     * @param {boolean=} ok If this is true, then the alert should be a good
     *                      color.
     */
    renderAlert: function(alertText, ok) {
      this.alertHolder.html(Mustache.render(Alert, {
        alert: alertText,
        ok: ok || false,
        danger: !ok
      }));
    },
    /**
     * Saves quiz info to remote server. Can fail.
     */
    sync: function() {
      var isNew;
      this.trigger('displaySpinner', true);
      this.$('#sync').attr('disabled', true);
      isNew = this.wordList.isNew();
      this.wordList.persistToServer(_.bind(function() {
        this.renderAlert(Mustache.render(SaveSuccess, {
          isNew: isNew,
          name: this.wordList.get('name'),
          lexicon: this.wordList.get('lexicon')
        }), true);
        this.trigger('displaySpinner', false);
        this.$('#sync').removeAttr('disabled');
        this.trigger('listPersisted', this.wordList);
      }, this),
      _.bind(function(model, jqXHR) {
        if (jqXHR.responseJSON) {
          this.renderAlert(jqXHR.responseJSON);
        } else {
          this.renderAlert([
            'Unable to persist to server; perhaps you are not currently ',
            'connected to the Internet?'
          ].join(''));
        }
        this.trigger('displaySpinner', false);
        this.$('#sync').removeAttr('disabled');
      }, this));
    }
  });
});
