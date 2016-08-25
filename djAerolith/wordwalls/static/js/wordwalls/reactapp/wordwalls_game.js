/**
 * @fileOverview Contains logic for wrong word hashes, etc. Used as a
 * helper to calculate state for the react app in app.jsx.
 *
 * We also use this as a sort of state store for the questions.
 * TODO: use immutable.js
 */
define([

], function() {
  "use strict";
  var Game;
  Game = function() {};
  /**
   * Initializes the main data structures.
   * @param  {Array.<Object>} questions The array of questions.
   * @return {Array.<Object>} The new question state.
   */
  Game.prototype.init = function(questions) {
    this.wrongWordsHash = {};
    this.wrongAlphasHash = {};
    this.questionState = questions;
    questions.forEach(function(question) {
      question.ws.forEach(function(word) {
        this.wrongWordsHash[word.w] = word;
        word.solved = false;
      }.bind(this));
      this.wrongAlphasHash[question.a] = question;
      question.solved = false;
    }.bind(this));

    console.log('this.questionState', this.questionState);
    return this.questionState;
  };
  /**
   * Solve a word. This will modify the elements in the hashes, which
   * modifies the state.
   * @param {string} word
   * @param {string} alphagram
   */
  Game.prototype.solve = function(word, alphagram) {
    var w, a, remainingWords;
    w = this.wrongWordsHash[word];
    if (!w) {
      return;
    }
    w.solved = true;
    delete this.wrongWordsHash[word];
    a = this.wrongAlphasHash[alphagram];
    remainingWords = a.ws.filter(function(word) {
      return !word.solved;
    });
    if (remainingWords.length === 0) {
      a.solved = true;
      delete this.wrongAlphasHash[alphagram];
    }
  };
  /**
   * Get the current question state.
   * @return {Array.<Object>}
   */
  Game.prototype.getQuestionState = function() {
    return this.questionState;
  };

  return Game;
});