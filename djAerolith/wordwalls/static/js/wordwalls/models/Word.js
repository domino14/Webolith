/* global define */
define([
  'backbone',
  'utils'
], function(Backbone, utils) {
  "use strict";
  var Word;
  Word = Backbone.Model.extend({
    defaults: function() {
      return {
        word: null,
        guessed: null,
        definition: null,
        frontHooks: null,
        backHooks: null,
        lexiconSymbol: null,
        alphagram: null,
        prob: null,
        innerFrontHook: false,
        innerBackHook: false
      };
    },
    /**
     * Get display version of this word, possibly including lexicon symbol.
     * @return {string}
     */
    display: function(lexicon, showLexiconSymbol) {
      var s;
      s = utils.modifyWordForDisplay(this.get('word'), lexicon);
      if (showLexiconSymbol) {
        s += this.get('lexiconSymbol');
      }
      return s;
    }
  });
  return Word;
});