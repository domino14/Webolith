/* global exports */
/** The logic for the wordwalls game. */

var _ = require('underscore');

(function() {
  "use strict";
  /**
   * Holds all the WordwallsGame logic objects; a dictionary of tablenum
   * to object.
   * @type {Object}
   */
  var WordwallsGameCache = {};

  /**
   * The main logic for a multiplayer wordwalls game. Mostly keeps track
   * of missed questions, etc. This should eventually persist to a
   * database or Redis, but for now will be in memory.
   * XXX: This must be fixed soon, otherwise it'll be impossible to
   * update the node.js code without data loss.
   * @param {number} tablenum
   */
  function WordwallsGame(tablenum) {
    /**
     * The table number.
     * @type {number}
     */
    this.tablenum_ = tablenum;
    /**
     * All the questions for this table. This is not just for the
     * current "round", but contains the entire set of questions.
     * @type {Object}
     */
    this.questions_ = {};
    /**
     * The current hash of questions.
     * @type {Object}
     */
    this.currentAnswerHash_ = {};
  }

  WordwallsGame.prototype.getQuestions = function() {
    // get from http://private_ip:8000/api/questions/this.tablenum_

    this.questions_ = myObj;
  };

  WordwallsGame.prototype.handleCorrectGuess = function() {

  };

  exports.WordwallsGame = WordwallsGame;

}());