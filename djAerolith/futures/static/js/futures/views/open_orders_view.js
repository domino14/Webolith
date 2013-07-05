define([
  'backbone',
  'jquery',
  'underscore',
  'mustache',
  'text!templates/open_orders.html',
  'bootstrap'
], function(Backbone, $, _, Mustache, OpenOrdersTemplate) {
  "use strict";
  var MAX_ORDER_SETTLE = 1000;
  return Backbone.View.extend({
    initialize: function(options) {
      /**
       * An array of orders.
       * @type {Array.<Object>}
       */
      this.orders = options.orders;
      /**
       * An array of only orders to display. These have the full name.
       * @type {Array.<Object>}
       */
      this.displayOrders = [];
    },
    events: {
      'click .cancel-order': 'cancelOrder'
    },
    /**
     * Update the list of open orders for this category.
     * @param  {Backbone.Collection} futures
     */
    updateShares: function(futures) {
      this.displayOrders = [];
      _.each(this.orders, function(order) {
        if (!_.has(futures.futureMap, order.future)) {
          return;
        }
        this.displayOrders.push({
          id: order.id,
          name: futures.futureMap[order.future],
          quantity: order.quantity,
          unitPrice: order.unit_price,
          frozen: order.order_type === 'B' ? order.quantity * order.unit_price :
            (MAX_ORDER_SETTLE - order.unit_price) * order.quantity,
          buy: order.order_type === 'B',
          sell: order.order_type === 'S',
          orderType: order.order_type === 'B' ? 'Buy' : 'Sell'
        });
      }, this);
      this.render();
    },
    /**
     * Render the orders.
     */
    render: function() {
      var context;
      context = {orders: this.displayOrders};
      this.$el.html(Mustache.render(OpenOrdersTemplate, context));
      this.$('.has-tooltip').tooltip();
      return this;
    },
    /**
     * Cancel an order.
     */
    cancelOrder: function(e) {
      console.log('canceling order', $(e.target).data('orderid'));
    }
  });
});