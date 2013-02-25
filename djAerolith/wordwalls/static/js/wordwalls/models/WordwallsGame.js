/**
 * @fileOverview A file that holds the front-end logic for the Wordwalls game.
 */

WW.WordwallsGame = Backbone.Model.extend({
  initialize: function() {
    this.gameGoing = false;
    this.quizzingOnMissed = false;
    this.quizOverForever = false;
    this.currentTimer = 0;
    this.gameTimerID = null;
    this.challenge = false;
    this.questionCollection = new WW.Alphagram.Collection;
  },
  processQuestionObj: function(questions) {
    _.each(questions, function(question, index) {
      var wordCollection, questionModel;
      questionModel = new WW.Alphagram.Model();
      wordCollection = new WW.Word.Collection();
      questionModel.set({
        alphagram: question.a,
        prob: question.p,
        numWords: question.ws.length,
        words: wordCollection
      });
      _.each(question.ws, function(word) {
        /* Add each word to the word collection. */
        wordCollection.add({
          word: word.w,
          frontHooks: word.fh,
          backHooks: word.bh,
          lexiconSymbol: word.s,
          definition: word.d
        });
      });
      this.questionCollection.add(questionModel);
    }, this);
    this.trigger('gotQuestionData', this.questionCollection);
  },
  /**
   * Start interval timer.
   * @param  {number} time A time in seconds.
   */
  startTimer: function(time) {
    // +1 since we're about to call this function.
    this.currentTimer = time + 1;
    this.gameTimerID = window.setInterval(
      _.bind(this.updateTimer, this), 1000);
    this.updateTimer(); // Call it now, too.
    this.gameGoing = true;
  },
  updateTimer: function() {
    this.currentTimer--;
    this.trigger('tick', this.currentTimer);
    if (this.currentTimer === 0) {
      window.clearInterval(this.gameTimerID);
      this.trigger('timerExpired');
    }
  }
});