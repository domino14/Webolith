/**
 * @fileOverview A generic crossword game view. Basically, just the board.
 */
define([
  'backbone',
  'models/crossword_game',
  'raphael'
], function(Backbone, CrosswordGame, Raphael) {
  "use strict";
  return Backbone.View.extend({
    initialize: function(options) {
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
      this.game.set(options.gameDescription);
      this.edgeFill = '#ddd';
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
      var i, j, x, y, place, r, grid;
      grid = this.game.get('grid');
      for (i = 0; i < 15; i++) {
        for (j = 0; j < 15; j++) {
          x = i * this.tilesize + this.lMarg;
          y = j * this.tilesize + this.tMarg;
          place = i * 15 + j;
          r = this.paper.rect(
            x, y, this.tilesize, this.tilesize, this.radius).attr({
            'fill': this.colors[grid[place]],
            'cursor': 'pointer',
            'stroke': '#999',
            'stroke-width': 0.5
          });
        }
      }
      for (i = 0; i < 15; i++) {
        x = i * this.tilesize + this.lMarg;
        r = this.paper.rect(x, 0, this.tilesize, this.tMarg).attr({
          'fill': this.edgeFill,
          'stroke': '#888'
        });
      }
      for (j = 0; j < 15; j++) {
        y = j * this.tilesize + this.tMarg;
        r = this.paper.rect(0, y, this.lMarg, this.tilesize).attr({
          'fill': this.edgeFill,
          'stroke': '#888'
        });
      }
      this.paper.rect(0, 0, this.lMarg, this.tMarg).attr({
        'fill': this.edgeFill,
        'stroke': '#888'
      });


    }
  });
});