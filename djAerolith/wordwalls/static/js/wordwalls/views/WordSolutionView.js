define([
  "backbone",
  "underscore",
  "text!templates/singleSolution.html",
  "mustache"
  ], function(Backbone, _, SingleSolution, Mustache) {
  "use strict";
  var SolutionView = Backbone.View.extend({
    /*
     * An alphagram view is the main question view.
     */
    tagName: 'tr',
    initialize: function() {
      this.listenTo(this.model, 'change', _.bind(this.render, this));
      this.listenTo(this.model.get('alphagram'), 'change',
        _.bind(this.render, this));
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
      }
      this.$el.html(Mustache.render(SingleSolution, attrs));
      return this;
    }
  });
  return SolutionView;
});