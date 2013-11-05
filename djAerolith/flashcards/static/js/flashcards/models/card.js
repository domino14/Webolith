/**
 * @fileOverview This file defines a Card, which is a generic representation
 * of a question.
 */
define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Card;
  Card = Backbone.Model.extend({
    initialize: function() {

    },
    defaults: {
      /**
       * An array of objects, each representing an answer. Each object
       * has keys b_hooks, def, f_hooks, symbols, and word.
       * @type {Array}
       */
      answers: [],
      /**
       * Has this card/question been missed?
       * @type {boolean}
       */
      missed: false,
      /**
       * The probability of this word among words of its length.
       * @type {number}
       */
      probability: 0,
      /**
       * A string representation of the question, most likely an alphagram.
       * @type {string}
       */
      question: ''
    }
  });

  return Card;
});