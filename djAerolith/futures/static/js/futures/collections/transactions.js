define([
  'backbone',
  'models/transaction'
], function(Backbone, Transaction) {
  "use strict";
  return Backbone.Collection.extend({
    model: Transaction
  });
});