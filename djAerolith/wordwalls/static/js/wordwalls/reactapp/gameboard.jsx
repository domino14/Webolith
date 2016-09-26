define([
  'react',
  'jsx!reactapp/wordwalls_question'
], function(React, WordwallsQuestion) {
  "use strict";
  var GameBoard = React.createClass({
    getDefaultProps: function() {
      // Maybe move this to the configurator.
      return {
        displayStyle: {
          tc: {
            on: true,
            selection: '1',
            bold: false,
            customOrder: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?',
            blankCharacter: '?',
            font: 'mono'
          },
          bc: {
            showTable: true,
            showBorders: false,
            showCanvas: true
          }
        },
        width: 720,
        height: 390,
        gridWidth: 4,
        gridHeight: 13
      };
    },
    getQuestionStyle: function() {
      var qStyle = this.props.displayStyle.tc;
      qStyle['showBorders'] = this.props.displayStyle.bc.showBorders;
      return qStyle;
    },
    render: function() {
      var questions, questionsClassName, questionDisplayStyle, xSize, ySize;
      questionsClassName = '';
      questions = [];
      questionDisplayStyle = this.getQuestionStyle();
      // xSize and ySize are the size that each question object takes
      // up.
      xSize = this.props.width / this.props.gridWidth;
      ySize = this.props.height / this.props.gridHeight;
      // curQuestions is an Immutable List of Maps
      this.props.curQuestions.forEach(function(question, idx) {
        // Calculate top left X, Y based on dimensions.
        var gridX, gridY;

        gridX = idx % this.props.gridWidth * xSize;
        gridY = Math.floor(idx / this.props.gridWidth) * ySize;

        questions.push(
          <WordwallsQuestion
            displayStyle={questionDisplayStyle}
            letters={question.get('displayedAs')}
            key={idx}
            qNumber={idx}
            words={question.get('wMap')}
            gridX={gridX}
            gridY={gridY}
            ySize={ySize}
            xSize={xSize}
            onShuffle={this.props.onShuffle}
          />);
      }.bind(this));
      if (this.props.displayStyle.bc.showTable) {
        questionsClassName = 'tableBg';
      }
      return (
        /*
        <div id="questions"
             className={questionsClassName}>
          <ul className="questionList">{questions}</ul>
        </div>
        */
        // Prevent default on mouse down to prevent taking focus in
        // case of misclick.
        <svg
          className="gameboard"
          onMouseDown={function(e) { e.preventDefault(); }}
          width={this.props.width}
          height={this.props.height}>
          {questions}
        </svg>
      );
    }
  });

  return GameBoard;
});