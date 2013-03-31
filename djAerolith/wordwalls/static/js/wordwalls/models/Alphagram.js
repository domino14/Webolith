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
    }
  });
  return Alphagram;
});