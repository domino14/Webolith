define([
  'backbone',
  'models/Word'
  ], function(Backbone, Word) {
  var Words;
  Words = Backbone.Collection.extend({
    model: Word
  });
  return Word;
});