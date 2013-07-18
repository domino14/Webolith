define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Router.extend({
    routes: {
      "video/:id": "videoEmbed"
    }
  });
});