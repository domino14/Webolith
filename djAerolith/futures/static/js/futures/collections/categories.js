define([
  'backbone',
  'models/category'
], function(Backbone, Category) {
  "use strict";
  return Backbone.Collection.extend({
    model: Category
  });
});