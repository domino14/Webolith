define([
  'backbone',
  'models/future'
], function(Backbone, Future) {
  "use strict";
  var Futures;
  Futures = Backbone.Collection.extend({
    model: Future,
    /**
     * Load futures from a category.
     * @param  {number} categoryId The category database id.
     */
    loadFromCategory: function(categoryId) {
      this.fetch({data: {category: categoryId}, reset: true});

    },
    url: '/futures/api/futures/'

  });
  return Futures;
});