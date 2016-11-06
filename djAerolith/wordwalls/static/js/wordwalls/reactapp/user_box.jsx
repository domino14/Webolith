define([
  'react',
  'jsx!reactapp/word_part_display'
], function(React, WordPartDisplay) {
  "use strict";
  return React.createClass({
    render: function() {
      var answers, percentScore, fractionScore;
      answers = [];
      this.props.answeredByMe.forEach(function(word, idx) {
        answers.push(
          <div
            key={idx}
            data-toggle="tooltip"
            data-placement="left"
            title={word.get('d')}
          >
            <WordPartDisplay
              text={`${word.get('fh')} `}
              classes="text-info small"
            />
            <WordPartDisplay
              text={word.get('w') + (this.props.showLexiconSymbols ?
                word.get('s') : '')}
            />
            <WordPartDisplay
              text={` ${word.get('bh')}`}
              classes="text-info small"
            />
          </div>);
      }.bind(this));
      //console.log('The answers are ', answers);
      percentScore = this.props.totalWords > 0 ?
        (100 * (this.props.answeredByMe.length / this.props.totalWords)).
          toFixed(1) : 0;

      fractionScore = this.props.answeredByMe.length + ' / ' +
        this.props.totalWords;

      return (
        <div className="panel panel-default">
          <div className="panel-heading">
            <span>{this.props.username}</span>
          </div>
          <div className="panel-body"
            style={{
              height: 200,
              overflow: 'auto',
            }}
            ref={(domNode) => {
              if (domNode === null) {
                return;
              }
              domNode.scrollTop = domNode.scrollHeight;
            }}
          >{answers}
          </div>
          <div className="panel-footer">
            <div className="row">
              <div className="col-sm-4 col-md-4">
                <span>{`${percentScore}%`}</span>
              </div>
              <div className="col-sm-8 col-md-6 col-md-offset-2">
                <span>{fractionScore}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  });
});
