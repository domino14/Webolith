define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Order;
  Order = Backbone.Model.extend({
    defaults: {
      future: null,
      quantity: 0,
      unit_price: 0,
      executed: false
    },
    initialize: function() {

    }
  });
  return Order;
});