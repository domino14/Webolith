define([
  'react',
  'jsx!reactapp/wordwalls_question',
  'jsx!reactapp/solutions'
], function(React, WordwallsQuestion, Solutions) {
  "use strict";
  var GameBoard = React.createClass({
    getDefaultProps: function() {
      return {
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
      if (this.props.gameGoing || this.props.numberOfRounds === 0) {
        return (
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

      return (
        <Solutions
          questions={this.props.origQuestions}
          answeredByMe={this.props.answeredByMe}
          totalWords={this.props.totalWords}
          height={this.props.height}
          markMissed={this.props.markMissed}
          showLexiconSymbols={!this.props.displayStyle.bc.hideLexiconSymbols}
        />
      );
    }
  });

  return GameBoard;
});