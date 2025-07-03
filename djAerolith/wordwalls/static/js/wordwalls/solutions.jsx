import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

import Solution from './solution';

function Solutions(props) {
  const tableRows = [];
  let wordIdx = 0;
  let hasDifficulty = false;
  const { showLexiconSymbols, markMissed } = props;

  props.questions.forEach((question) => {
    if (!hasDifficulty && question.get('df', 0)) {
      hasDifficulty = true;
      return false; // break early from the loop
    }
  });

  props.questions.forEach((question) => {
    question.get('ws').forEach((word, wordPos) => {
      tableRows.push(<Solution
        key={wordIdx}
        wordPos={wordPos}
        idx={question.get('idx')}
        probability={question.get('p') || ''}
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
        wrongGuess={question.get('wrongGuess', false)}
        difficulty={question.get('df', '-') || '-'}
        showDifficulty={hasDifficulty}
        markMissed={markMissed}
      />);
      wordIdx += 1;
    });
  });


  let statsStr;

  if (props.totalWords > 0) {
    statsStr = `Correct: ${props.numCorrect} / ${props.totalWords}
      (${((100 * props.numCorrect) / props.totalWords).toFixed(1)}%)`;
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
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
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Probability</th>
                {hasDifficulty && <th>Difficulty</th>}
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

Solutions.propTypes = {
  questions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
  numCorrect: PropTypes.number.isRequired,
  totalWords: PropTypes.number.isRequired,
  markMissed: PropTypes.func.isRequired,
  showLexiconSymbols: PropTypes.bool.isRequired,
};

export default Solutions;
