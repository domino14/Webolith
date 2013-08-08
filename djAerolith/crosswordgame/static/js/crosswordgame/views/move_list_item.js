define([
  'backbone',
  'text!templates/move.html',
  'mustache'
], function(Backbone, MoveTemplate, Mustache) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {

    },
    render: function() {
      var json = this.model.toJSON();
      if (json.score > 0) {
        json.score = '+' + json.score;
      }
      this.$el.html(Mustache.render(MoveTemplate, json));
      return this;
    }
  });
});
