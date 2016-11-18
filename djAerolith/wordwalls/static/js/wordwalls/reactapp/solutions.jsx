import React from 'react';
import Immutable from 'immutable';

import Solution from './solution';

const Solutions = (props) => {
  const tableRows = [];
  let wordIdx = 0;
  const showLexiconSymbols = props.showLexiconSymbols;
  const markMissed = props.markMissed;
  props.questions.forEach((question) => {
    question.get('ws').forEach((word, wordPos) => {
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
          lexiconSymbols={showLexiconSymbols ? word.get('s') : ''}
          definition={word.get('d')}
          wordSolved={word.get('solved', false)}
          correct={question.get('solved', false)}
          markMissed={markMissed}
        />);
      wordIdx += 1;
    });
  });

  const numCorrect = props.answeredByMe.length;
  let statsStr;

  if (props.totalWords > 0) {
    statsStr = `Correct: ${numCorrect} / ${props.totalWords}
      (${((100 * numCorrect) / props.totalWords).toFixed(1)}%)`;
  }

  // console.log('rendering Solutions', JSON.stringify(this.props.questions));
  return (
    <div
      style={{
        height: props.height,
        overflowX: 'hidden',
      }}
    >
      <div className="row">
        <div className="col-lg-12">
          {statsStr}
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 table-responsive">
          <table
            className="table table-condensed table-bordered"
          >
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
};

Solutions.propTypes = {
  questions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
};

export default Solutions;
