define([
  'react'
], function(React) {
  "use strict";
  var Solutions, Solution;

  Solution = React.createClass({
    markMissed: function() {
      this.props.markMissed(this.props.idx, this.props.alphagram);
    },
    render: function() {
      var qTdClass, wTdClass, wordDisplay, markMissedBtn = '';
      qTdClass = '';
      if (!this.props.correct) {
        qTdClass = 'danger';
      }
      wTdClass = 'text-nowrap';
      if (!this.props.wordSolved) {
        wTdClass += ' danger';
      }
      wordDisplay = (this.props.innerFrontHook ? '･' : '') + this.props.word +
       (this.props.innerBackHook ? '･' : '') + this.props.lexiconSymbols;

      if (this.props.correct && this.props.wordPos === 0) {
        markMissedBtn = (
          <button
            className="btn btn-sm btn-danger"
            onClick={this.markMissed}>Mark missed</button>
        );
      }

      return (
        <tr>
          <td>{this.props.wordPos === 0 ?
               this.props.probability : ''}</td>
          <td
            className={qTdClass}>{this.props.wordPos === 0 ?
                                  this.props.alphagram : ''}</td>
          <td
            className="text-right">{this.props.frontHooks}</td>
          <td className={wTdClass}>{wordDisplay}</td>
          <td
            className="text-left">{this.props.backHooks}</td>
          <td>{this.props.definition}</td>
          <td>{markMissedBtn}</td>
        </tr>
      );
    }
  });


  Solutions = React.createClass({
    render: function() {
      var tableRows, wordIdx, statsStr, numCorrect;
      tableRows = [];
      wordIdx = 0;
      this.props.questions.forEach(function(question) {
        question.get('ws').forEach(function(word, wordPos) {
          tableRows.push(
            <Solution
              key={wordIdx}
              wordPos={wordPos}
              idx={question.get('idx')}
              probability={question.get('p')}
              alphagram={question.get('a')}
              frontHooks={word.get('fh')}
              backHooks={word.get('bh')}
              word={word.get('w')}
              innerFrontHook={word.get('ifh')}
              innerBackHook={word.get('ibh')}
              lexiconSymbols={this.props.showLexiconSymbols ?
                word.get('s') : ''}
              definition={word.get('d')}
              wordSolved={word.get('solved', false)}
              correct={question.get('solved', false)}
              markMissed={this.props.markMissed}
              />
          );
          wordIdx++;
        }, this);
      }, this);
      numCorrect = this.props.answeredByMe.length;
      if (this.props.totalWords > 0) {
        statsStr = `Correct: ${numCorrect} / ${this.props.totalWords}
          (${(100 * numCorrect / this.props.totalWords).toFixed(1)}%)`;
      }

      console.log('rendering Solutions', JSON.stringify(this.props.questions));
      return (
        <div
          style={{
            height: this.props.height,
            overflow: 'scroll'
          }}>
          <div className="row">
            <div className="col-lg-12">
              {statsStr}
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <table
                className="table table-condensed table-bordered">
                <thead>
                  <tr>
                    <th>Probability</th>
                    <th>Alphagram</th>
                    <th>&lt;</th>
                    <th>Word</th>
                    <th>&gt;</th>
                    <th>Definition</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
  });
  return Solutions;
});