/**
 * @fileOverview A view for a "move" on the crossword game board. This does
 * not have a stand-alone el, but it uses the game board element to draw tiles
 * on top.
 */
define([
  'backbone',
  'underscore'
], function(Backbone, _) {
  "use strict";
  return Backbone.View.extend({
    initialize: function(options) {
      this.paper = options.paper;
      this.tilesize = options.tilesize;
      this.radius = options.radius;
      this.lMarg = options.lMarg;
      this.tMarg = options.tMarg;
      this.DOMels = [];
    },
    /**
     * Remove this play from the board. Destroy the DOM elements, basically.
     */
    withdraw: function() {
      _.each(this.DOMels, function(el) {
        // Remove the actual dom el from the paper one by one.
        el.remove();
      });
    },
    /**
     * Handles a move.
     * @param {Object} event The move event.
     */
    handle: function(event) {
      var type;
      type = event.get('event');
      if (type === 'play') {
        this.renderPlay_(event.attributes);
      }
    },
    /**
     * Renders an actual play on the board.
     * @param {Object} event The play object.
     */
    renderPlay_: function(event) {
      var i, j, columnIdx, rowIdx, x, y, letter;
      columnIdx = event.column.charCodeAt(0) - 'A'.charCodeAt(0);
      rowIdx = event.row - 1;
      if (event.direction === 'horizontal') {
        for (i = columnIdx; i < columnIdx + event.play.length; i++) {
          j = rowIdx;
          x = i * this.tilesize + this.lMarg + 1;
          y = j * this.tilesize + this.tMarg + 1;
          letter = event.play[i - columnIdx];
          this.drawTile_(x, y, letter);

        }
      } else if (event.direction === 'vertical') {
        for (j = rowIdx; j < rowIdx + event.play.length; j++) {
          i = columnIdx;
          x = i * this.tilesize + this.lMarg + 1;
          y = j * this.tilesize + this.tMarg + 1;
          letter = event.play[j - rowIdx];
          this.drawTile_(x, y, letter);
        }
      }
    },
    /**
     * Draws a tile with a letter in it.
     */
    drawTile_: function(x, y, letter) {
      // This special letter has already been drawn (it is a play-through).
      if (letter === '.') {
        return;
      }
      this.DOMels.push(this.paper.rect(
        x, y, this.tilesize - 2, this.tilesize - 2, this.radius).attr({
        'fill': '#fff',
        'stroke': '#000',
        'stroke-width': 1
      }));
      this.DOMels.push(this.paper.text(x + this.tilesize / 2,
        y + this.tilesize / 2, letter).attr({
        'font-size': 15,
        'fill': '#000'
      }));
    }
  });
});