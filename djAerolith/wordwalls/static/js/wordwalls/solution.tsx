import React from 'react';

import WordPartDisplay from './word_part_display';

interface SolutionProps {
  markMissed: (idx: number, alphagram: string) => void;
  idx: number;
  alphagram: string;
  correct: boolean;
  wrongGuess: boolean;
  wordSolved: boolean;
  innerFrontHook: boolean;
  innerBackHook: boolean;
  word: string;
  lexiconSymbols: string;
  wordPos: number;
  probability: number | string;
  frontHooks: string;
  backHooks: string;
  definition: string;
  difficulty: number;
  showDifficulty: boolean;
}

function Solution({
  markMissed,
  idx,
  alphagram,
  correct,
  wrongGuess,
  wordSolved,
  innerFrontHook,
  innerBackHook,
  word,
  lexiconSymbols,
  wordPos,
  probability,
  frontHooks,
  backHooks,
  definition,
  difficulty,
  showDifficulty,
}: SolutionProps) {
  const handleMarkMissed = () => {
    markMissed(idx, alphagram);
  };

  let qTdClass = '';
  let wTdClass = 'text-nowrap';
  let markMissedBtn;
  let rowStyle: React.CSSProperties = {};

  if (!correct) {
    qTdClass = 'danger';
  } else if (wrongGuess) {
    qTdClass = 'warning';
  }
  if (!wordSolved) {
    wTdClass += ' danger';
  }
  const wordDisplay = (innerFrontHook ? '･' : '') + word + (innerBackHook ? '･' : '') + lexiconSymbols;

  if (correct && wordPos === 0) {
    markMissedBtn = (
      <button
        type="button"
        className="btn btn-sm btn-danger"
        onClick={handleMarkMissed}
      >
        Mark missed
      </button>
    );
  }
  const alphagramDisplay = wordPos === 0 ? <WordPartDisplay text={alphagram} /> : '';

  // Visually separate different alphagrams.
  if (wordPos === 0) {
    rowStyle = { borderTop: '1px solid #777777' };
  }

  return (
    <tr>
      <td style={rowStyle}>{wordPos === 0 ? probability : ''}</td>
      {showDifficulty ? (
        <td
          className={difficulty > 80 ? 'text-danger' : ''}
          style={rowStyle}
        >
          {wordPos === 0 ? difficulty : ''}
        </td>
      ) : null}
      <td style={rowStyle} className={qTdClass}>
        {alphagramDisplay}
      </td>
      <td style={rowStyle} className="text-end">
        <WordPartDisplay classes="text-info small" text={frontHooks} />
      </td>
      <td className={wTdClass} style={rowStyle}>
        <WordPartDisplay text={wordDisplay} />
      </td>
      <td className="text-start" style={rowStyle}>
        <WordPartDisplay classes="text-info small" text={backHooks} />
      </td>
      <td style={{ ...rowStyle, ...{ whiteSpace: 'pre-wrap' } }}>
        {definition}
      </td>
      <td style={rowStyle}>{markMissedBtn}</td>
    </tr>
  );
}

export default Solution;
