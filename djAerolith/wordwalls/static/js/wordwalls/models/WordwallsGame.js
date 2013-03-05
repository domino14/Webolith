/**
 * @fileOverview A file that holds the front-end logic for the Wordwalls game.
 */
"use strict";
WW.WordwallsGame = Backbone.Model.extend({
  initialize: function() {
    this.gameGoing = false;
    this.quizzingOnMissed = false;
    this.quizOverForever = false;
    this.currentTimer = 0;
    this.challenge = false;
    this.questionCollection = new WW.Alphagram.Collection();
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

    _.each(questions, function(question, index) {
      var wordCollection, questionModel;
      questionModel = new WW.Alphagram.Model();
      wordCollection = new WW.Word.Collection();
      questionModel.set({
        alphagram: question.a,
        prob: question.p,
        numWords: question.ws.length,
        wordsRemaining: question.ws.length,
        words: wordCollection
      });
      _.each(question.ws, function(word) {
        /* Add each word to the word collection. */
        var wordModel = new WW.Word.Model({
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
    _.delay(_.bind(this.updateTimer, this), 1000);
    this.updateTimer(); // Call it now, too.
    this.gameGoing = true;
  },
  updateTimer: function() {
    var timeNow;
    if (!this.gameGoing) {
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
    /*
    var fractionText = numAnswersGottenThisRound + '/' + numTotalAnswersThisRound;
                        var percentText = (numAnswersGottenThisRound / numTotalAnswersThisRound * 100).toFixed(1) + '%';
                        $('#pointsLabelFraction').text(fractionText);
                        $('#pointsLabelPercent').text(percentText);
                        $("#solstats").text(fractionText + ' (' + percentText + ')');

     */
  },
  finishedAlphagram: function(alphagram) {
    delete this.wrongAlphasHash[alphagram];
  },
  endGame: function() {
    if (this.gameGoing) {
      if (this.challenge) {
        this.trigger('message', 'The challenge has ended!');
        /* TODO getDcData */
      }
      if (this.autoSave) {
        /* TODO saveGame */
      } else {
        this.trigger('message', [
          "Autosave is NOT on. To save your progress, type in a name ",
          "for this list next to the Save button, and click Save."].join(''));
      }
      this.gameGoing = false;
      _.each(this.wrongWordsHash, function(word) {
        word.set('wrong', true);
      });
      _.each(this.wrongAlphasHash, function(alphagram) {
        alphagram.set('wrong', true);
      });
    }
  }
});