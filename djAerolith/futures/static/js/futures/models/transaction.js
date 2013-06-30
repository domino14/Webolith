/**
 * A transaction is not necessarily a completed transaction; this is important.
 * It can be a desired transaction as well (an open buy or sell on the market).
 */
define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Transaction;
  Transaction = Backbone.Model.extend({
    defaults: {
      future: null,
      quantity: 0,
      unit_price: 0,
      executed: false
    },
    initialize: function() {

    }
  });
  return Transaction;
});