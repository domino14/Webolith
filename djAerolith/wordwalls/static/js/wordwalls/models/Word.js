/* global define */
define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Word;
  Word = Backbone.Model.extend({
    defaults: function() {
      return {
        word: null,
        definition: null,
        frontHooks: null,
        backHooks: null,
        lexiconSymbol: null,
        alphagram: null,
        prob: null,
        innerFrontHook: false,
        innerBackHook: false
      };
    }
  });
  return Word;
});