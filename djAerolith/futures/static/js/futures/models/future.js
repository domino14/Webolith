define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Future;
  Future = Backbone.Model.extend({
    defaults: {
      name: '',
      description: '',
      is_open: false,
      last_buy: 0,
      volume: 0
    },
    initialize: function() {

    }
  });
  return Future;
});