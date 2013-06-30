define([
  'backbone'
], function(Backbone) {
  "use strict";
  return Backbone.Router.extend({
    routes: {
      "category/:id": "categoryDetail",
      "instructions": "instructions"
    }
  });
});