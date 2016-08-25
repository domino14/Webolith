define([
  'react',
  'jsx!reactapp/wordwalls_question'
], function(React, WordwallsQuestion) {
  "use strict";
  var GameBoard = React.createClass({
    render: function() {
      var questions = [];
      this.props.questions.forEach(function(question) {
        questions.push(
          <WordwallsQuestion
            letters={question.a}
            key={question.a}
            words={question.ws}/>);
      });
      return (
        <div id="questions">
          <ul className="questionList">{questions}</ul>
        </div>
      );
    }
  });

  return GameBoard;
});