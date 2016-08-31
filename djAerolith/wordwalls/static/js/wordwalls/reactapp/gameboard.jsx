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
        }
      };
    },
    getQuestionStyle: function() {
      var qStyle = this.props.displayStyle.tc;
      qStyle['showBorders'] = this.props.displayStyle.bc.showBorders;
      return qStyle;
    },
    render: function() {
      var questions, questionsClassName, questionDisplayStyle;
      questionsClassName = '';
      questions = [];
      questionDisplayStyle = this.getQuestionStyle();
      // questions is an Immutable List of Maps
      this.props.curQuestions.forEach(function(question, idx) {
        questions.push(
          <WordwallsQuestion
            displayStyle={questionDisplayStyle}
            letters={question.get('a')}
            key={idx}
            words={question.get('ws')}
          />);
      }.bind(this));
      if (this.props.displayStyle.bc.showTable) {
        questionsClassName = 'tableBg';
      }
      return (
        <div id="questions"
             className={questionsClassName}>
          <ul className="questionList">{questions}</ul>
        </div>
      );
    }
  });

  return GameBoard;
});