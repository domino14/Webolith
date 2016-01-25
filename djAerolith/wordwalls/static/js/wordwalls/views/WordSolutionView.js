/* global django */
/**
 * @fileOverview This is the view for a single row in the solutions table.
 * Basically, a single word solution.
 */
define([
  "backbone",
  "underscore",
  "jquery",
  "text!templates/singleSolution.html",
  "mustache",
  "jquery_ui"
], function(Backbone, _, $, SingleSolution, Mustache) {
  "use strict";
  var SolutionView = Backbone.View.extend({
    tagName: 'tr',
    initialize: function() {
      this.listenTo(this.model, 'change', _.bind(this.render, this));
      this.listenTo(this.model.get('alphagram'), 'change',
        _.bind(this.render, this));
    },
    events: {
      'click .mark-missed': 'markMissedClicked_'
    },
    render: function() {
      var attrs;
      /*
       * In this view, we only want to show probability / alphagram for
       * the first word in a collection.
       */
      attrs = _.clone(this.model.attributes);
      if (attrs.alphagram) {
        if (attrs.alphagram.attributes.wrong) {
          attrs.wrongAlpha = true;
        }
        attrs.alphagramText = attrs.alphagram.get('alphagram');
      }
      if (this.model.collection &&
          this.model.collection.indexOf(this.model) !== 0) {
        delete attrs.alphagramText;
        delete attrs.prob;
        delete attrs.wrongAlpha;
      }
      if (this.model.collection && this.model.collection.indexOf(
        this.model) === 0 && !attrs.wrongAlpha) {
        attrs.markMissedBtn = true;
      }
      attrs['i18n_ui_markmissed'] = django.gettext('Mark missed');
      this.$el.html(Mustache.render(SingleSolution, attrs));
      this.$('.mark-missed').button();
      return this;
    },
    markMissedClicked_: function() {
      this.trigger('markMissed', this.model.get('alphagram').get('idx'),
        this);
    },
    /**
     * Marks this view as missed.
     */
    markMissed: function() {
      this.model.get('alphagram').set('wrong', true);
    }
  });
  return SolutionView;
});