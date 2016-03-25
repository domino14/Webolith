/* global define*/
/**
 * @fileOverview A file that holds the front-end logic for the Wordwalls game.
 */
define([
  'backbone',
  'collections/Alphagrams',
  'collections/Words',
  'models/Alphagram',
  'models/Word',
  'underscore'
], function(Backbone, Alphagrams, Words, Alphagram, Word, _) {
  "use strict";
  var Game = Backbone.Model.extend({
    defaults: function() {
      return {
        gameGoing: false,
        challenge: false,
        autoSave: false
      };
    },
    initialize: function() {
      this.currentTimer = 0;
      this.questionCollection = new Alphagrams();
      this.timeStarted = null;
      this.timeForQuiz = null;
      this.wrongWordsHash = {};
      this.wrongAlphasHash = {};
      this.numTotalAnswersThisRound = 0;
      this.numAnswersGottenThisRound = 0;
      this.numAlphagramsLeft = 0;
    },
    /**
     * Process a list of questions.
     * @param  {Array.<Object>} questions A list of questions in  {'q': ...,
     *  'a': [...]} format.
     *
     */
    processQuestionObj: function(questions) {
      this.wrongWordsHash = {};
      this.wrongAlphasHash = {};
      this.numTotalAnswersThisRound = 0;
      this.numAnswersGottenThisRound = 0;
      this.cleanupPrevious();
      _.each(questions, function(question, idx) {
        var wordCollection, questionModel;
        questionModel = new Alphagram();
        wordCollection = new Words();
        questionModel.set({
          alphagram: question.question,
          prob: question.probability,
          numWords: question.answers.length,
          wordsRemaining: question.answers.length,
          words: wordCollection,
          idx: idx
        });
        _.each(question.answers, function(answer) {
          /* Add each word to the word collection. */
          var wordModel = new Word({
            word: answer.word,
            frontHooks: answer.f_hooks,
            backHooks: answer.b_hooks,
            lexiconSymbol: answer.symbols,
            definition: answer.def,
            alphagram: questionModel,
            prob: question.probability,
            innerFrontHook: answer.f_inner,
            innerBackHook: answer.b_inner
          });
          wordCollection.add(wordModel);
          this.wrongWordsHash[answer.word] = wordModel;
          this.numTotalAnswersThisRound++;
        }, this);
        this.questionCollection.add(questionModel);
        this.wrongAlphasHash[question.question] = questionModel;
      }, this);
      this.numAlphagramsLeft = this.questionCollection.length;
      this.trigger('gotQuestionData', this.questionCollection);
    },
    /**
     * Start interval timer.
     * @param  {number} time A time in seconds.
     */
    startTimer: function(time) {
      /* Store started timestamp and the time allotted for this quiz. */
      this.timeStarted = new Date().getTime();
      this.timeForQuiz = time;
      /* Add 1 since we're about to call this function. */
      this.currentTimer = time + 1;
      this.updateTimer();
    },
    updateTimer: function() {
      var timeNow;
      if (!this.get('gameGoing')) {
        return;
      }
      timeNow = new Date().getTime();
      this.currentTimer = this.timeForQuiz - (
        timeNow - this.timeStarted) / 1000.0;
      this.trigger('tick', this.currentTimer);
      _.delay(_.bind(this.updateTimer, this), 1000);
    },
    correctGuess: function(word) {
      delete this.wrongWordsHash[word];
      this.numAnswersGottenThisRound++;
      this.trigger('updateQStats', this.numTotalAnswersThisRound,
        this.numAnswersGottenThisRound);
    },
    finishedAlphagram: function(alphagram) {
      delete this.wrongAlphasHash[alphagram];
      this.numAlphagramsLeft--;
    },
    /**
     * Returns the number of alphagrams that have not been yet solved.
     * @return {number} The number of alphagrams left this round.
     */
    alphagramsLeft: function() {
      return this.numAlphagramsLeft;
    },
    endGame: function() {
      if (this.get('gameGoing')) {
        if (this.get('challenge')) {
          this.trigger('challengeEnded');
        }
        if (this.get('autoSave')) {
          this.trigger('saveGame');
        } else {
          this.trigger('autosaveDisabled');
        }
        _.each(this.wrongWordsHash, function(word) {
          word.set('wrong', true);
        });
        _.each(this.wrongAlphasHash, function(alphagram) {
          alphagram.set('wrong', true);
        });
        this.set('gameGoing', false);
      }
    },
    /**
     * Cleans up old models / collections / etc.
     */
    cleanupPrevious: function() {
      this.questionCollection.each(function(question) {
        question.get('words').reset();
      });
      this.questionCollection.reset();
    }
  });
  return Game;
});