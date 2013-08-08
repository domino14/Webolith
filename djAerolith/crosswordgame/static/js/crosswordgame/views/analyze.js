/**
 * @fileOverview This is the main analyze view for analyzing gcg games.
 */
define([
  'backbone',
  'jquery',
  'views/crossword',
  'views/move_list_item',
  'collections/gcg_event_list'
], function(Backbone, $, Crossword, MoveListItem, GCGEventList) {
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
        el: $('#gameBoard'),
        gameDescription: options.gcg
      });
      this.moves.reset(options.gcg.moves);
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
      console.log('rendering');
      this.crosswordView.render();
    },

    goBack: function() {},

    goForward: function() {}
  });
  return BoardView;
});