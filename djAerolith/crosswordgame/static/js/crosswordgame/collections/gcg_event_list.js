define([
  'backbone',
  'models/gcg_event'
], function(Backbone, GCGEvent) {
  "use strict";
  return Backbone.Collection.extend({
    model: GCGEvent
  });
});