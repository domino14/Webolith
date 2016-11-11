import React from 'react';
import Solution from './solution';

const Solutions = (props) => {
  // var tableRows, wordIdx, statsStr, numCorrect;
  const tableRows = [];
  let wordIdx = 0;
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
          lexiconSymbols={props.showLexiconSymbols ?
            word.get('s') : ''}
          definition={word.get('d')}
          wordSolved={word.get('solved', false)}
          correct={question.get('solved', false)}
          markMissed={props.markMissed}
        />
      );
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
        <div className="col-lg-12">
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
  questions: React.PropTypes.any,
  answeredByMe: React.PropTypes.array,
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
};

export default Solutions;
