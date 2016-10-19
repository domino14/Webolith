/**
 * @fileOverview Contains logic for wrong word hashes, etc. Used as a
 * helper to calculate state for the react app in app.jsx.
 *
 * We also use this as a sort of state store for the questions.
 */
define([
  'immutable',
  'underscore'
], function(Immutable, _) {
  "use strict";

  var Game, MAX_SCREEN_QUESTIONS;
  // The maximum number of questions that can be displayed on a table
  // at once (any more are outside of the viewport).
  MAX_SCREEN_QUESTIONS = 50;
  Game = function() {
    this.curQuestions = Immutable.List();
    this.origQuestions = Immutable.List();
  };
  /**
   * Initializes the main data structures when a new array comes in.
   * @param  {Array.<Object>} questions The array of questions.
   * @return {Immutable} The original questions as an immutable.
   */
  Game.prototype.init = function(questions) {
    var qMap = {}, reducedQuestions = [];
    this.wrongWordsHash = {};
    // Hash of "alphagram strings" to indices in curQuestions.
    this.alphaIndexHash = {};
    this.alphagramsLeft = 0;
    // Answered by me is a list of words answered by the current user.
    this.answeredByMe = [];
    this.totalWords = 0;
    questions.forEach(function(question, aidx) {
      var wMap = {};
      question.ws.forEach(function(word, idx) {
        this.wrongWordsHash[word.w] = idx;
        this.totalWords += 1;
        wMap[word.w] = word;
      }.bind(this));
      question.answersRemaining = question.ws.length;
      this.alphaIndexHash[question.a] = aidx;
      qMap[question.a] = question;
      reducedQuestions.push({
        "a": question.a, "wMap": wMap,
        "displayedAs": question.a
      });
    }.bind(this));
    this.alphagramsLeft = questions.length;
    this.origQuestions = Immutable.fromJS(qMap).toOrderedMap();
    // This structure is used just for the initial display.
    this.curQuestions = Immutable.fromJS(reducedQuestions);
  };

  Game.prototype.miss = function(alphagram) {
    this.origQuestions = this.origQuestions.update(alphagram, function(aObj) {
      aObj = aObj.set('solved', false);
      return aObj;
    });
  };

  /**
   * Solve a word. This will modify the elements in the hashes, which
   * modifies the state.
   * @param {string} word
   * @param {string} alphagram
   */
  Game.prototype.solve = function(word, alphagram) {
    var widx, aidx;
    widx = this.wrongWordsHash[word];
    if (widx == null) {
      return;
    }

    delete this.wrongWordsHash[word];

    // Update the word object; add a solved property.
    this.origQuestions = this.origQuestions.updateIn(
      [alphagram, 'ws', widx], function(wObj) {
        this.answeredByMe.push(wObj);
        return wObj.set('solved', true);
    }.bind(this));
    // Look up the index of this alphagram in the alphaIndex hash.
    // This index is mutable and represents the current display position.
    aidx = this.alphaIndexHash[alphagram];
    // Delete the word from the curQuestions word map.
    this.curQuestions = this.curQuestions.deleteIn([aidx, 'wMap', word]);

    this.origQuestions = this.origQuestions.update(alphagram, function(aObj) {
      var replacementAlpha;
      aObj = aObj.set('answersRemaining', aObj.get('answersRemaining') - 1);
      if (aObj.get('answersRemaining') !== 0) {
        return aObj;
      }
      // Otherwise, the alphagram is fully solved.
      // Set it to solved in the original questions, and delete the alphagram
      // from the alphaIndexHash.
      aObj = aObj.set('solved', true);
      this.alphagramsLeft--;
      delete this.alphaIndexHash[alphagram];
      // Replace the alphagram in curQuestions with a blank space.
      this.curQuestions = this.curQuestions.update(aidx, function() {
        // Create an empty map. This will not be rendered by the front end.
        return Immutable.fromJS({});
      });

      if (this.alphagramsLeft > MAX_SCREEN_QUESTIONS) {
        // If we can't fit all the words in the screen, we want to replace
        // the word we just solved.
        replacementAlpha = this.curQuestions.last();

        // Set the alpha at `aidx` to the last alpha in the list.
        this.curQuestions = this.curQuestions.pop().set(aidx, replacementAlpha);
        // Change the index in this.alphaIndexHash to aidx, for the new
        // alphagram (replace in place).
        this.alphaIndexHash[replacementAlpha.get('a')] = aidx;

      }
      return aObj;
    }.bind(this));
  };
  /**
   * Get the current question state.
   * @return {Immutable.List}
   */
  Game.prototype.getQuestionState = function() {
    return this.curQuestions;
  };

  /**
   * Get the original question state.
   * @return {Immutable.List}
   */
  Game.prototype.getOriginalQuestionState = function() {
    return this.origQuestions;
  };

  Game.prototype.getTotalNumWords = function() {
    return this.totalWords;
  };

  Game.prototype.getAnsweredByMe = function() {
    return this.answeredByMe;
  };

  /**
   * Shuffle the element at the index given by which.
   * @param  {number} which
   */
  Game.prototype.shuffle = function(which) {
    this.curQuestions = this.curQuestions.update(which, function(aObj) {
      aObj = aObj.set('displayedAs', _.shuffle(aObj.get('a')).join(''));
      return aObj;
    });
  };

  Game.prototype.shuffleAll = function() {
    if (!this.curQuestions) {
      return;
    }
    for (var i = 0; i < this.curQuestions.size; i++) {
      // XXX can we speed this up with `withMutations`?
      this.shuffle(i);
    }
  };

  Game.prototype.resetAllOrders = function() {
    if (!this.curQuestions) {
      return;
    }
    for (var i = 0; i < this.curQuestions.size; i++) {
      this.curQuestions = this.curQuestions.update(i, function(aObj) {
        aObj = aObj.set('displayedAs', aObj.get('a'));
        return aObj;
      });
    }
  };

  Game.prototype.setCustomLetterOrder = function(order) {
    var customOrder;
    if (!order || !this.curQuestions) {
      return;
    }

    /**
     * Sorts a string into the custom order given by `order`.
     * @param  {string} letters
     * @return {string}
     */
    customOrder = function(letters) {
      letters = _.sortBy(letters, function(letter) {
        return order.indexOf(letter);
      });
      return letters.join('');
    };

    // XXX: Don't make functions within a loop ??????
    for (var i = 0; i < this.curQuestions.size; i++) {
      this.curQuestions = this.curQuestions.update(i, function(aObj) {
        aObj = aObj.set('displayedAs', customOrder(aObj.get('a')));
        return aObj;
      });
    }
  };
  return Game;
});