define([
  'backbone',
  '../models/card'
], function(Backbone, Card) {
  "use strict";
  var Cards;
  Cards = Backbone.Collection.extend({
    model: Card
  });

  return Cards;
});
