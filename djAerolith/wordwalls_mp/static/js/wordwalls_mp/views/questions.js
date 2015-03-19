/**
 * @fileOverview The questions view. This is the "pool table" with the
 * tiles.
 */
define([
  'backbone',
  'd3'
], function(Backbone, d3) {
  "use strict";
  var Questions, TABLE_WIDTH, TABLE_HEIGHT, QUESTION_WIDTH, QUESTION_HEIGHT,
    NUM_COLUMNS, TILE_HEIGHT, TILE_WIDTH;
  /**
   * The width of the SVG.
   * @type {number}
   */
  TABLE_WIDTH = 860;
  /**
   * The height of the SVG.
   * @type {number}
   */
  TABLE_HEIGHT = 355;
  /**
   * Width of a single question rect.
   * @type {number}
   */
  QUESTION_WIDTH = 207;
  /**
   * Height of a single question rect.
   * @type {number}
   */
  QUESTION_HEIGHT = 26;
  /**
   * Number of columns of questions.
   * @type {number}
   */
  NUM_COLUMNS = 4;

  TILE_HEIGHT = 24;
  TILE_WIDTH = 24;
  /**
   * Table is the view that controls everything about the table. It may have
   * subviews.
   */
  Questions = Backbone.View.extend({
    initialize: function() {
      var svg;
      svg = this.svg_();
      svg.attr('width', TABLE_WIDTH).attr('height', TABLE_HEIGHT);
    },
    /**
     * Gets the svg and selects it with d3.
     * @return {d3.Selection}
     */
    svg_: function() {
      var svg;
      svg = this.$el;
      return d3.select(svg.get(0));
    },
    render: function() {

    },
    showQuestions: function(questions) {
      var svg, question, rect;
      function xTranslate(i) {
        return (i % NUM_COLUMNS) * (TABLE_WIDTH / 4);
      }

      function yTranslate(i) {
        return Math.floor(i / NUM_COLUMNS) * QUESTION_HEIGHT;
      }
      this.questions = questions;
      svg = this.svg_();
      question = svg.selectAll('g.question')
        .data(questions);
      question.enter().append('g').attr('class', 'question');
      question.exit().remove();
      question.attr('transform', function(d, i) {
        // Place question g in proper place. Then all tile coordinates
        // can be relative.
        return "translate("+ xTranslate(i) +"," + yTranslate(i) + ")";
      });
      rect = question.selectAll('rect')
        .data(function(d) {
          return d.alphagram.split('');
        });
      rect.enter().append('rect');

      rect
        .attr('width', TILE_WIDTH)
        .attr('height', TILE_HEIGHT)
        .attr('x', function(d, i) {
          return i * TILE_WIDTH;
        })
        .attr('y', 0)
        .attr('fill', '#ffff00')
        .attr('stroke', '#000000');
      rect.exit().remove();
    }
  });

  return Questions;
});