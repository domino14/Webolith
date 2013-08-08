define([
  'backbone'
], function(Backbone) {
  return Backbone.View.extend({
    initialize: function() {

    },
    // XXX: use templates
    render: function() {
      var json = this.model.toJSON();
      this.$el.html(['<P>', json.player, ': ', json.coordinates,
                     ' ', json.play, ' ',
                     json.score > 0 ? '+' + json.score : json.score,
                     ' ', json.totalscore, '</P>'].join(''));
      return this;
    }
  })
});
