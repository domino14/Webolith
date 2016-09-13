define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({


    render: function() {
      var answers, percentScore, fractionScore;
      answers = [];
     // console.log('Answered by me', JSON.stringify(this.props.answeredByMe));
      this.props.answeredByMe.forEach(function(word, idx) {
        answers.push(
          <div key={idx}>
            {word.get('w') +
              (this.props.showLexiconSymbol ? word.get('s') : '')}
          </div>);
      }.bind(this));
      //console.log('The answers are ', answers);
      percentScore = this.props.totalWords > 0 ?
        (100 * this.props.answeredByMe.length / this.props.totalWords).
          toFixed(1) : 0;

      fractionScore = this.props.answeredByMe.length + ' / ' +
        this.props.totalWords;

      return (
        <div className="panel panel-default">
          <div className="panel-heading">
            <span>{this.props.username}</span>
          </div>
          <div className="panel-body"
            style={{height: 200, overflow: 'auto'}}>
            {answers}
          </div>
          <div className="panel-footer">
            <div className="row">
              <div className="col-sm-4 col-md-4">
                <span>{percentScore + '%'}</span>
              </div>
              <div
                className="col-sm-8 col-md-6 col-md-offset-2">
                <span>{fractionScore}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  });
});