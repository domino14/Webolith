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
        quizzingOnMissed: false,
        quizOverForever: false,
        challenge: false
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
    },
    processQuestionObj: function(questions) {
      this.wrongWordsHash = {};
      this.wrongAlphasHash = {};
      this.numTotalAnswersThisRound = 0;
      this.numAnswersGottenThisRound = 0;
      this.cleanupPrevious();
      _.each(questions, function(question) {
        var wordCollection, questionModel;
        questionModel = new Alphagram();
        wordCollection = new Words();
        questionModel.set({
          alphagram: question.a,
          prob: question.p,
          numWords: question.ws.length,
          wordsRemaining: question.ws.length,
          words: wordCollection
        });
        _.each(question.ws, function(word) {
          /* Add each word to the word collection. */
          var wordModel = new Word({
            word: word.w,
            frontHooks: word.fh,
            backHooks: word.bh,
            lexiconSymbol: word.s,
            definition: word.d,
            alphagram: questionModel,
            prob: question.p
          });
          wordCollection.add(wordModel);
          this.wrongWordsHash[word.w] = wordModel;
          this.numTotalAnswersThisRound++;
        }, this);
        this.questionCollection.add(questionModel);
        this.wrongAlphasHash[question.a] = questionModel;
      }, this);
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
      if (this.currentTimer <= 0) {
        this.trigger('timerExpired');
      } else {
        _.delay(_.bind(this.updateTimer, this), 1000);
      }
    },
    correctGuess: function(word) {
      delete this.wrongWordsHash[word];
      this.numAnswersGottenThisRound++;
      this.trigger('updateQStats', this.numTotalAnswersThisRound,
        this.numAnswersGottenThisRound);
    },
    finishedAlphagram: function(alphagram) {
      delete this.wrongAlphasHash[alphagram];
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