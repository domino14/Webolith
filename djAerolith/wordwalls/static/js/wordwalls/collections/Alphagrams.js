define([
  'backbone',
  'models/Alphagram'
  ], function(Backbone, Alphagram) {
  "use strict";
  var Alphagrams;
  Alphagrams = Backbone.Collection.extend({
    model: Alphagram
  });
  return Alphagrams;
});