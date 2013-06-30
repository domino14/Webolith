define([
  'backbone'
], function(Backbone) {
  "use strict";
  var Category;
  Category = Backbone.Model.extend({
    defaults: {
      name: '',
      description: ''
    }
  });
  return Category;
});