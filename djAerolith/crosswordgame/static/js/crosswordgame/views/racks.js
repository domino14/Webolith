/**
 * @fileOverview This has the view for the user racks as well as scores.
 */
define([
  'backbone',
  'underscore',
  'mustache',
  'text!templates/rack.html'
], function(Backbone, _, Mustache, RackTemplate) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {

    },
    handleRack: function(player, rack) {
      this.$el.html(Mustache.render(RackTemplate, {
        player: player,
        rack: rack
      }));
    }
  });
});