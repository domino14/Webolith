/**
 * @fileOverview The word list model. This model should almost mirror the model
 * for SavedList in base/models.py.
 */
define([
  'underscore',
  'backbone',
  'jquery',
  'collections/cards'
], function(_, Backbone, $, Cards) {
  "use strict";
  var QUIZ_API_URL;
  QUIZ_API_URL = '/base/api/saved_list/';
  return Backbone.Model.extend({
    initialize: function() {
      /**
       * A map of question IDs to alphagram/word/definition/etc.
       */
      this.questionMap_ = null;
      /**
       * A collection of `Card`s.
       * @type {Backbone.Collection}
       */
      this.cards = new Cards();
    },
    // Model variables.
    defaults: {
      /**
       * The name of the lexicon.
       * @type {string}
       */
      lexicon: '',
      /**
       * When this list was last saved.
       * @type {Date}
       */
      lastSaved: null,
      /**
       * The name of the list.
       * @type {string}
       */
      name: null,
      /**
       * Number of alphagrams in entire list.
       * @type {number}
       */
      numAlphagrams: 0,
      /**
       * Number of alphagrams in current quiz.
       * @type {number}
       */
      numCurAlphagrams: 0,
      /**
       * Number of first-missed questions - the questions that were
       * missed the first time thru this quiz.
       * @type {number}
       */
      numFirstMissed: 0,
      /**
       * Number of total missed questions at the moment.
       * @type {number}
       */
      numMissed: 0,
      /**
       * Has this quiz been gone through at least once?
       * @type {boolean}
       */
      goneThruOnce: false,
      /**
       * The index of the current question.
       * @type {number}
       */
      questionIndex: 0,
      /**
       * An array of original questions. These are the indices of the
       * alphagrams in the Alphagram model.
       * @type {Array.<number>}
       */
      origQuestions: [],
      /**
       * An array of current questions. These are the indices of the
       * questions in the origQuestions array - 0 through origQuestions.length.
       * @type {Array.<number>}
       */
      curQuestions: [],
      /**
       * An array of currently missed questions. Also indices 0 through
       * origQuestions.length.
       * @type {Array.<number>}
       */
      missed: [],
      /**
       * An array of first missed questions. Also indices 0 through
       * origQuestions.length.
       * @type {Array.<number>}
       */
      firstMissed: []
    },

    /**
     * Resets the word list to a brand new list, from the server.
     * Note: This shuffles the questions that come in from the back end.
     * @param {Object} wordList An object with most of the above keys.
     * @param  {Object} questionMap An object with a mapping of question id
     *                              to question object.
     * @param  {string} quizName The name of the quiz.
     */
    reset: function(wordList, questionMap, quizName) {
      var shuffled;
      this.set(wordList);
      shuffled = _.shuffle(this.get('curQuestions'));
      this.set({
        curQuestions: shuffled,
        name: quizName
      });
      this.questionMap_ = questionMap;
      // Save question map in local storage here only.
      localStorage.setItem('aerolith-cards-qmap', JSON.stringify(
        this.questionMap_));
      // Generate "cards".
      this.cards.reset(this.getQuestions_());
      this.saveStateLocal_();
    },
    /**
     * Returns an array of current questions.
     * @return {Array.<Object>}
     * @private
     */
    getQuestions_: function() {
      var qs, orig, missed, missedDict;
      qs = [];
      orig = this.get('origQuestions');
      missed = this.get('missed');
      missedDict = {};
      // Store in a hash for faster lookups.
      _.each(missed, function(qIndex) {
        missedDict[qIndex] = true;
      });
      _.each(this.get('curQuestions'), function(qIndex) {
        var qId, card;
        qId = orig[qIndex];
        card = _.clone(this.questionMap_[qId]);
        if (_.has(missedDict, qIndex)) {
          card.missed = true;
        }
        qs.push(card);
      }, this);
      return qs;
    },
    /**
     * Saves to local storage. Only saves one word list worth, so this
     * overwrites whatever was there.
     */
    saveStateLocal_: function() {
      this.set('lastSaved', new Date().toString());
      localStorage.setItem('aerolith-cards-current-wl', JSON.stringify(this));
    },
    /**
     * Loads word list and question map from local storage.
     */
    loadFromLocal: function() {
      var stored, map;
      stored = localStorage.getItem('aerolith-cards-current-wl');
      map = localStorage.getItem('aerolith-cards-qmap');
      if (stored) {
        this.set(JSON.parse(stored));
      }
      if (map) {
        this.questionMap_ = JSON.parse(map);
      }
      // Remove any nulls in missed list if they exist.
      this.set('missed', _.without(this.get('missed'), null));
      this.cards.reset(this.getQuestions_());
    },
    /**
     * Marks the current card missed (or not missed).
     * @param  {boolean} missed Missed or not.
     */
    markCurrentMissed: function(missed) {
      var curQIndex, curMissed, found, currentCard;
      curQIndex = this.get('curQuestions')[this.get('questionIndex')];
      // XXX: Linear search unfortunately.
      curMissed = this.get('missed');
      found = _.indexOf(curMissed, curQIndex);
      if (missed && found === -1) {
        // Add to missed list.
        curMissed.push(curQIndex);
      } else if (!missed && found >= 0) {
        // Remove from missed list, make null.
        curMissed[found] = null;
      }
      currentCard = this.currentCard();
      if (!currentCard) {
        return;
      }
      currentCard.set('missed', missed);
    },
    advanceCard: function() {
      // Increase question index.
      var qIndex;
      qIndex = this.get('questionIndex');
      qIndex += 1;
      this.set('questionIndex', qIndex);
      if (qIndex >= this.cards.size()) {
        this.endQuiz();
      }
      this.saveStateLocal_();
    },
    previousCard: function() {
      // Decrease question index.
      var qIndex;
      qIndex = this.get('questionIndex');
      if (qIndex === 0) {
        return;
      }
      this.set('questionIndex', qIndex - 1);
      this.saveStateLocal_();
    },
    endQuiz: function() {
      var missedCards;
      missedCards = this.cards.where({missed: true});
      if (!this.get('goneThruOnce')) {
        this.set('goneThruOnce', true);
        // XXX: mark first mised etc.
      }
      this.cards.reset(missedCards);
      this.cards.each(function(card) {
        card.set({missed: false});
      });
      this.set('questionIndex', 0);
      this.set('curQuestions', this.get('missed'));
      this.set('numCurAlphagrams', _.size(this.get('curQuestions')));
      this.set('missed', []);
      this.trigger('quizEnded');
    },
    /**
     * Getter for the current question index.
     * @return {number}
     */
    currentIndex: function() {
      return this.get('questionIndex');
    },
    /**
     * Get the current card.
     * return {Card}
     */
    currentCard: function() {
      return this.cards.at(this.get('questionIndex'));
    },
    numCards: function() {
      return this.cards.size();
    },
    /**
     * Persists current state to server. Can fail.
     * @param {Function} success Gets called if this is successful.
     * @param {Function} fail Gets called if the persist fails.
     */
    persistToServer: function(success, fail) {
      $.post(QUIZ_API_URL + 'sync/', JSON.stringify(this), function(data) {
        success(data);
      }, 'json').fail(fail);
    },
    /**
     * Loads quiz from remote storage. Does no confirmation.
     * @param {string} action The action, such as continue, first missed.
     * @param {string} id The id of the quiz.
     * @param {Function} success Success callback.
     * @param {Function} fail Gets called if list fails to load.
     */
    loadFromRemote: function(action, id, success, fail) {
      var url, type;
      url = QUIZ_API_URL + id + '/';
      // continue / firstmissed / reset are GETs as they are idempotent.
      // If user syncs afterwards, this will be DESTRUCTIVE which is why sync
      // is a POST.
      if (action === 'continue') {
        type = 'GET';
      } else if (action === 'firstmissed') {
        type = 'GET';
      } else if (action === 'reset') {
        type = 'GET';
      } else if (action === 'delete') {
        type = 'DELETE';
      }
      $.ajax({
        url: url,
        type: type,
        success: function(result) {
          success(result);
        },
      }).fail(fail);
    }
  });
});
