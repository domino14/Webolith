/**
 * @fileOverview The questions view. This is the "pool table" with the
 * tiles.
 */
define([
  'backbone',
  'underscore',
  'd3'
], function(Backbone, _, d3) {
  "use strict";
  var Questions, TABLE_WIDTH, TABLE_HEIGHT, QUESTION_WIDTH, QUESTION_HEIGHT,
    NUM_COLUMNS, TILE_HEIGHT, TILE_WIDTH, FIRST_TILE_SPACING;
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
  /**
   * @type {number}
   */
  TILE_HEIGHT = 18;
  /**
   * @type {number}
   */
  TILE_WIDTH = 18;
  /**
   * @type {number}
   */
  FIRST_TILE_SPACING = 2;
  /**
   * Table is the view that controls everything about the table. It may have
   * subviews.
   */
  Questions = Backbone.View.extend({
    initialize: function() {
      var svg;
      svg = this.svg_();
      svg.attr('width', TABLE_WIDTH).attr('height', TABLE_HEIGHT);
      this.answerMap = {};
      this.questions = [];
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
    /**
     * Set questions to the array.
     * @param {Array.<Object>} questions
     */
    setQuestions: function(questions) {
      this.questions = questions;
      _.each(questions, function(question, index) {
        _.each(question.words, function(wordObj) {
          this.answerMap[wordObj.word.toLowerCase()] = {
            q: question,
            i: index
          };
        }, this);
      }, this);
      this.showQuestions_();
    },
    /**
     * Show the questions in this.questions.
     */
    showQuestions_: function() {
      var svg, question;
      function xTranslate(i) {
        return (i % NUM_COLUMNS) * (TABLE_WIDTH / 4);
      }

      function yTranslate(i) {
        return Math.floor(i / NUM_COLUMNS) * QUESTION_HEIGHT;
      }
      svg = this.svg_();
      question = svg.selectAll('g.question')
        .data(this.questions);
      question.enter().append('g').attr('class', 'question');
      question.exit().remove();
      question.attr('transform', function(d, i) {
        // Place question g in proper place. Then all tile coordinates
        // can be relative.
        return "translate(" + xTranslate(i) + "," + yTranslate(i) + ")";
      });
      this.drawQuestions_(question);
      this.drawChips_(question);

    },
    /**
     * Draw the actual questions.
     * @param {d3.Selection} question
     */
    drawQuestions_: function(question) {
      var rect, tileText;
      rect = question.selectAll('rect')
        .data(function(d) {
          return d.alphagram.split('');
        });
      rect.enter().append('rect');
      rect
        .attr('width', TILE_WIDTH)
        .attr('height', TILE_HEIGHT)
        .attr('x', function(d, i) {
          return i * TILE_WIDTH + TILE_WIDTH + FIRST_TILE_SPACING;
        })
        .attr('y', 0)
        .attr('fill', '#4400BA')
        .attr('stroke', '#000000');
      tileText = question.selectAll('text.tile')
        .data(function(d) {
          return d.alphagram.split('');
        });
      tileText.enter().append('text').attr('class', 'tile');
      tileText
        .attr('x', function(d, i) {
          return i * TILE_WIDTH + 2 + TILE_WIDTH + FIRST_TILE_SPACING ;
        })
        .attr('y', TILE_HEIGHT * 0.8)
        .attr('fill', 'white')
        .attr('font-family', 'monospace')
        .attr('font-size', '150%')
        .text(function(d) {
          return d;
        });
      rect.exit().remove();
      tileText.exit().remove();
    },
    /**
     * Draw the chips next to the alphagrams, indicating the number of
     * unsolved alphagrams.
     * @param {d3.Selection} question
     */
    drawChips_: function(question) {
      var circle, circleText;
      circle = question.selectAll('circle')
        .data(function(d) {
          if (d.wordsRemaining > 0) {
            return [d.wordsRemaining];
          }
          return [];
        });
      circle.enter().append('circle');
      circle
        .attr('r', TILE_WIDTH / 2)
        .attr('cy', TILE_HEIGHT / 2)
        .attr('cx', TILE_WIDTH / 2)
        .attr('fill', '#ff0000');
      circleText = question.selectAll('text.chip')
        .data(function(d) {
          if (d.wordsRemaining > 0) {
            return [d.wordsRemaining];
          }
          return [];
        });
      circleText.enter().append('text').attr('class', 'chip');
      circleText
        .attr('x', TILE_WIDTH * 0.25)
        .attr('y', TILE_HEIGHT * 0.8)
        .attr('font-family', 'monospace')
        .attr('font-size', '120%')
        .text(function(d) {
          return d;
        });

      circle.exit().remove();
      circleText.exit().remove();
    },
    /**
     * Handle a guess.
     * @param  {string} guess
     */
    recordGuess: function(guess) {
      var answer, question;
      guess = guess.toLowerCase();
      if (!_.has(this.answerMap, guess)) {
        return;
      }
      answer = this.answerMap[guess];
      question = this.questions[answer.i];
      question.wordsRemaining--;
      if (question.wordsRemaining === 0) {
        question.alphagram = '';
      }
      delete this.answerMap[guess];
      this.showQuestions_();
    }

  });

  return Questions;
});