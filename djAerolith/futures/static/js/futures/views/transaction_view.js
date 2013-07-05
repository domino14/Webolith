define([
  'backbone',
  'underscore',
  'collections/transactions',
  'mustache',
  'text!templates/transactions.html'
], function(Backbone, _, Transactions, Mustache, TransactionsTemplate) {
  "use strict";
  return Backbone.View.extend({
    initialize: function(options) {
      this.transactions = new Transactions();
      this.listenTo(this.transactions, 'reset', _.bind(this.render, this));
      this.transactions.reset(options.transactions);
      this.displayTransactions = [];
    },
    render: function() {
      var context;
      context = {transactions: this.displayTransactions};
      this.$el.html(Mustache.render(TransactionsTemplate, context));
      return this;
    },
    updateShares: function(futures) {
      this.displayTransactions = [];
      this.transactions.each(function(transaction) {
        var obj;
        obj = transaction.toJSON();
        if (!_.has(futures.futureMap, obj.future)) {
          return;
        }
        if (obj.type === 'Buy') {
          obj.buy = true;
        } else if (obj.type === 'Sell') {
          obj.sell = true;
        }
        obj.name = futures.futureMap[obj.future];
        this.displayTransactions.push(obj);
      }, this);
      this.render();
    }
  });

});