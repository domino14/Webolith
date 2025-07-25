import React from 'react';

import Immutable from 'immutable';

import Solution from './solution';
import { type ImmutableWord, type ImmutableQuestion } from './immutable-types';

interface SolutionsProps {
  questions: Immutable.OrderedMap<string, ImmutableQuestion>;
  numCorrect: number;
  totalWords: number;
  markMissed: (idx: number, alphagram: string) => void;
  showLexiconSymbols: boolean;
}

function Solutions({
  questions,
  numCorrect,
  totalWords,
  markMissed,
  showLexiconSymbols,
}: SolutionsProps) {
  const tableRows: React.ReactElement[] = [];
  let wordIdx = 0;

  // Check if any question has difficulty data
  let hasDifficulty = false;
  questions.forEach((question) => {
    if (!hasDifficulty && question.get('df', 0)) {
      hasDifficulty = true;
      return false; // break early from the loop
    }
    return true;
  });

  questions.forEach((question) => {
    question.get('ws').forEach((word: ImmutableWord, wordPos: number) => {
      tableRows.push(
        <Solution
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
          difficulty={Number(question.get('df', 0)) || 0}
          showDifficulty={hasDifficulty}
          markMissed={markMissed}
        />,
      );
      wordIdx += 1;
    });
  });

  let statsStr: string | null = null;
  if (totalWords > 0) {
    statsStr = `Correct: ${numCorrect} / ${totalWords}
      (${((100 * numCorrect) / totalWords).toFixed(1)}%)`;
  }

  return (
    <div
      className="solutions-content"
      style={{
        overflowX: 'hidden',
        backgroundColor: 'white', // Light mode background
      }}
    >
      <div className="row">
        <div
          className="col-lg-12 solutions-stats"
          style={{
            padding: '10px 15px',
            backgroundColor: 'white', // Light mode background
          }}
        >
          {statsStr}
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 table-responsive">
          <table className="table table-condensed solutions-table">
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
            <tbody>{tableRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Solutions;
