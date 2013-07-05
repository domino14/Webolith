define([
  'backbone',
  'models/future'
], function(Backbone, Future) {
  "use strict";
  var Futures;
  Futures = Backbone.Collection.extend({
    initialize: function() {
      this.listenTo(this, 'reset', this.updateFutureMap);
      /**
       * The map of future id to future names.
       * @type {Object}
       */
      this.futureMap = {};
    },
    model: Future,
    /**
     * Load futures from a category.
     * @param  {number} categoryId The category database id.
     */
    loadFromCategory: function(categoryId) {
      this.fetch({data: {category: categoryId}, reset: true});

    },
    url: '/futures/api/futures/',
    /**
     * Update the map of future id to future name.
     * @param  {Backbone.Collection} futures The collection of futures.
     */
    updateFutureMap: function(futures) {
      this.futureMap = {};
      futures.each(function(future) {
        this.futureMap[(future.id).toString()] = future.get('name');
      }, this);
    }
  });
  return Futures;
});