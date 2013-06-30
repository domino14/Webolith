define([
  'backbone',
  'mustache',
  'text!templates/category.html'
], function(Backbone, Mustache, CategoryTemplate) {
  "use strict";
  return Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
    },
    render: function() {
      this.$el.html(Mustache.render(CategoryTemplate, this.model.toJSON()));
      return this;
    }
  });
});