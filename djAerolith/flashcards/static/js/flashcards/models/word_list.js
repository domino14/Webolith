/**
 * @fileOverview The word list model. This model should almost mirror the model
 * for SavedList in wordwalls/models.py.
 *
 * Maybe there should be a todo somewhere to move SavedList out of wordwalls
 * game models since this is the flashcards app that is using it :/ Maybe
 * somewhere like base but we'd have to change the table name / do a migration.
 */
define([
  'underscore',
  'backbone',
  'collections/cards'
], function(_, Backbone, Cards) {
  "use strict";
  return Backbone.Model.extend({
    initialize: function() {
      this.quizOver = false;
      this.curIndex = 0;
    },
    // Model variables.
    defaults: {
      /**
       * The name of the lexicon.
       * @type {string}
       */
      lexiconName: '',
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
     * Resets from an array of objects representing the cards.
     * @param {Array.<Object>} questions The list of questions.
     * @param {string} quizName The name of the quiz.
     */
    resetFromQuestionList: function(questions, quizName) {
      var origQuestions, curQuestions;
      origQuestions = [];
      curQuestions = [];
      _.each(questions, function(question, idx) {
        origQuestions.push(question.id);
        curQuestions.push(idx);
      });
      // Set the model variables.
      this.set({
        name: quizName,
        origQuestions: origQuestions,
        curQuestions: curQuestions,
        numAlphagrams: _.size(origQuestions),
        numCurAlphagrams: _.size(curQuestions)
      });

    }
  });
});
