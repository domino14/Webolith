/**
 * @fileOverview This is the main analyze view for analyzing gcg games.
 */
define([
  'backbone',
  'underscore',
  'jquery',
  'views/crossword',
  'views/racks',
  'views/move_list_item',
  'collections/gcg_event_list'
], function(Backbone, _, $, Crossword, RacksView, MoveListItem, GCGEventList) {
  "use strict";
  var BoardView;

  BoardView = Backbone.View.extend({
    events: {
      "click #back": "goBack",
      "click #forward": "goForward"
    },

    initialize: function (options) {
      this.moves = new GCGEventList();
      this.moves.on('reset', this.addAllMoves, this);
      this.moves.on('reset', this.render, this);
      this.crosswordView = new Crossword({
        el: this.$('#gameBoard')
      });
      this.moves.reset(options.gcg.moves);
      this.racksView = new RacksView({
        el: this.$('#rack-area')
      });
      this.crosswordView.on('rack', _.bind(this.racksView.handleRack,
        this.racksView));
      // Load the actual game.
      this.crosswordView.initGame(options.gcg);
    },

    addOneMove: function (move) {
      // add order
      var firstPlayer, order, view;
      firstPlayer = this.moves.at(0).get('player');
      if (move.get('player') === firstPlayer) {
        order = 1;
      }
      else {
        order = 2;
      }
      view = new MoveListItem({model: move});
      this.$("#player" + order + "moves").append(view.render().el);
    },
    addAllMoves: function () {
      this.moves.each(this.addOneMove, this);
    },

    render: function () {
      this.crosswordView.render();
    },

    goBack: function() {
      this.crosswordView.goBackMove();
    },

    goForward: function() {
      this.crosswordView.advanceMove();
    }
  });
  return BoardView;
});