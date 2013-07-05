define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Model.extend({
    defaults: {
      type: null,
      future: null,
      quantity: null,
      unitPrice: null,
      date: null
    }
  });
});