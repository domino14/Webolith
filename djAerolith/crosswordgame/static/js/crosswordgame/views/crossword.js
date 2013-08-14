/**
 * @fileOverview A generic crossword game view. Basically, the board
 * and the tiles on it.
 */
define([
  'backbone',
  'underscore',
  'models/crossword_game',
  'views/move',
  'raphael'
], function(Backbone, _, CrosswordGame, Move, Raphael) {
  "use strict";
  return Backbone.View.extend({
    initialize: function() {
      /**
       * Colors for the bonus squares.
       * @type {Object}
       */
      this.colors = {
        '3': "#ff2200",
        '2': "#ff99aa",
        '@': "#87ceeb",
        '#': "#0022ff",
        '.': "#fafffa"
      };
      this.boardWidth = 450;
      this.boardHeight = 450;
      this.paper = Raphael(this.el.id, this.boardWidth, this.boardHeight);
      this.tilesize = 26;
      this.lMarg = 20;
      this.tMarg = 20;
      this.radius = 0;
      this.game = new CrosswordGame({
        grid: [
          "3..@...3...@..3",
          ".2...#...#...2.",
          "..2...@.@...2..",
          "@..2...@...2..@",
          "....2.....2....",
          ".#...#...#...#.",
          "..@...@.@...@..",
          "3..@...2...@..3",
          "..@...@.@...@..",
          ".#...#...#...#.",
          "....2.....2....",
          "@..2...@...2..@",
          "..2...@.@...2..",
          ".2...#...#...2.",
          "3..@...3...@..3"
        ].join('')
      });
      this.listenTo(this.game, 'gcgEvent', _.bind(this.handleGCGEvent, this));
      this.listenTo(this.game, 'gcgEventUnrender', _.bind(this.unrenderEvent,
        this));
      this.listenTo(this.game, 'rack', _.bind(this.handleRack, this));
      this.edgeFill = '#ddd';
      /**
       * An array of Move views.
       * @type {Array.<Move>}
       */
      this.moves = [];
    },
    /**
     * Initialize game description.
     * @param {Object} gameDescription An object with a converted gcg
     *                                 description.
     */
    initGame: function(gameDescription) {
      this.game.initNew(gameDescription);
    },
    /**
     * Tell the crossword game model to advance one move.
     */
    advanceMove: function() {
      this.game.loadNextMove();
    },
    /**
     * Tell the crossword game model to go back one move.
     */
    goBackMove: function() {
      this.game.loadPreviousMove();
    },
    /**
     * Unrender the event with eventNumber.
     * @param {number} eventNumber The event number.
     */
    unrenderEvent: function(eventNumber) {
      if (this.moves[eventNumber]) {
        this.moves[eventNumber].withdraw();
      }
    },
    handleGCGEvent: function(event, eventNumber, goingBack) {
      var eventType;
      if (goingBack) {
        console.log('we are going back, undrender', eventNumber + 1)
        this.unrenderEvent(eventNumber + 1);
        return;
      }
      eventType = event.get('event');
      this.moves[eventNumber] = new Move({
        paper: this.paper,
        tilesize: this.tilesize,
        radius: this.radius,
        lMarg: this.lMarg,
        tMarg: this.tMarg
      });
      if (eventType === 'play') {
        this.moves[eventNumber].handle(event);
      } else if (eventType === 'withdrawnphoney') {
        this.moves[eventNumber - 1].withdraw();
      }
    },
    /**
     * Render a rack for this player.
     * @param {string} playerName
     * @param {string} rack
     */
    handleRack: function(playerName, rack) {
      this.trigger('rack', playerName, rack);
    },
    /**
     * Render the game board.
     */
    render: function() {
      this.drawGrid_();
    },
    /**
     * The actual grid of squares.
     */
    drawGrid_: function() {
      var i, j, x, y, place, grid, c;
      grid = this.game.get('grid');
      for (i = 0; i < 15; i++) {
        for (j = 0; j < 15; j++) {
          x = i * this.tilesize + this.lMarg;
          y = j * this.tilesize + this.tMarg;
          place = i * 15 + j;
          this.paper.rect(
            x, y, this.tilesize, this.tilesize, this.radius).attr({
            'fill': this.colors[grid[place]],
            'cursor': 'pointer',
            'stroke': '#999',
            'stroke-width': 0.5
          });
        }
      }
      // Draw annotation squares on edges.
      for (i = 0; i < 15; i++) {
        x = i * this.tilesize + this.lMarg;
        this.paper.rect(x, 0, this.tilesize, this.tMarg).attr({
          'fill': this.edgeFill,
          'stroke': '#888'
        });
        c = String.fromCharCode('A'.charCodeAt(0) + i);
        this.paper.text(x + this.tilesize / 2, this.tilesize / 2 - 2, c).attr({
          'font-size': 15,
          'fill': '#999'
        });
      }
      for (j = 0; j < 15; j++) {
        y = j * this.tilesize + this.tMarg;
        this.paper.rect(0, y, this.lMarg, this.tilesize).attr({
          'fill': this.edgeFill,
          'stroke': '#888'
        });
        this.paper.text(this.tilesize / 2 - 3, y + this.tilesize / 2,
          j + 1).attr({
            'font-size': 14,
            'fill': '#999'
          });
      }
      this.paper.rect(0, 0, this.lMarg, this.tMarg).attr({
        'fill': this.edgeFill,
        'stroke': '#888'
      });
    }
  });
});