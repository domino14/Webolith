define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Model.extend({
    defaults: {
      grid: null,
      bingoBonus: 50,
      distribution: null
    }
  });
});