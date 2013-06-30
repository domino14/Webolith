define([
  'backbone',
  'jquery',
  'mustache',
  'text!templates/future_detail.html'
], function(Backbone, $, Mustache, FutureTemplate) {
  "use strict";
  return Backbone.View.extend({
    tagName: 'div',
    className: 'well well-small',
    initialize: function() {
    },
    events: {
      'click .shares-buy': 'buyShares',
      'click .shares-sell': 'sellShares'
    },
    render: function() {
      this.$el.html(Mustache.render(FutureTemplate, this.model.toJSON()));
      return this;
    },
    /**
     * Buy shares was clicked. Put up shares for offer.
     */
    buyShares: function() {
      this.trigger('newOrder', this.model, 'buy');
    },
    /**
     * Sell shares was clicked. Sell a share you own (or short-sell).
     */
    sellShares: function() {
      this.trigger('newOrder', this.model, 'sell');
    }
  });
});