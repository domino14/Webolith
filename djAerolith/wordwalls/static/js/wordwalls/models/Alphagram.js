/* global define*/
define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Alphagram;
  Alphagram = Backbone.Model.extend({
    defaults: function() {
      return {
        alphagram: '',
        words: null,   /* Will be an instance of a Word Collection. */
        numWords: 0,
        wordsRemaining: null,
        prob: null
      };
    },
    /**
     * Enter a solution for this alphagram.
     * @param  {string} word [description]
     */
    solve: function(solution) {
      var wordsRemaining, foundWord;
      foundWord = this.get('words').find(function(word) {
        return word.get('word').toUpperCase() === solution;
      });
      if (foundWord.get('guessed') === true) {
        // This alphagram was already solved.
        return;
      }
      wordsRemaining = this.get('wordsRemaining');
      this.set('wordsRemaining', wordsRemaining - 1);
      foundWord.set('guessed', true);
    },
    /**
     * Return true if this alphagram has been fully solved.
     * @return {boolean}
     */
    fullySolved: function() {
      return this.get('wordsRemaining') === 0;
    }
  });
  return Alphagram;
});