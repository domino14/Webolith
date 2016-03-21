define([
  'backbone',
  'underscore'
], function(Backbone, _) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {
      this.$el.append('<div class="countdown"></div>');
      this.$timerEl = this.$('.countdown');
      this.keepCount = null;
    },
    /**
     * Start the countdown at `countdown` seconds.
     * @param  {number} countdown
     */
    start: function(countdown) {
      this.keepCount = countdown;
      this.tick(this.keepCount);
    },
    tick: function(time) {
      if (time === 0) {
        this.$timerEl.text('');
        return;
      }
      this.$timerEl.text(time);
      this.keepCount--;
      if (time !== 0) {
        window.setTimeout(_.bind(function() {
          this.tick(this.keepCount);
        }, this), 1000);
      }
    }
  });
});