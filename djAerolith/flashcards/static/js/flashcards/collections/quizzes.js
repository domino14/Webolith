/**
 * @fileOverview A collection of 'word_list' for user to select from.
 */
define([
  'backbone',
  '../models/word_list'
], function(Backbone, WordList) {
  "use strict";
  return Backbone.Collection.extend({
    model: WordList
  });
});
