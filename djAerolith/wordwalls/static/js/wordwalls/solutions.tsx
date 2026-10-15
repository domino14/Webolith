import React, { useState } from 'react';

import * as Immutable from 'immutable';

import Solution from './solution';
import { type ImmutableWord, type ImmutableQuestion } from './immutable-types';
import { plural, type WordVaultActions } from './use_wordvault';

// E.g. "add 23 new cards to WordVault (Long words) and mark 10 existing cards
// as missed".
const describeAddAllMissed = (wordVault: WordVaultActions) => {
  const parts: string[] = [];
  if (wordVault.numToAdd > 0) {
    parts.push(`add ${plural(wordVault.numToAdd, 'new card')} to WordVault${
      wordVault.deckName ? ` (${wordVault.deckName})` : ''}`);
  }
  if (wordVault.numToMark > 0) {
    parts.push(`mark ${plural(wordVault.numToMark, 'existing card')} as missed`);
  }
  return parts.join(' and ');
};

interface SolutionsProps {
  questions: Immutable.OrderedMap<string, ImmutableQuestion>;
  numCorrect: number;
  totalWords: number;
  markMissed: (questions: { idx: number; alphagram: string }[]) => void;
  showLexiconSymbols: boolean;
  wordVault: WordVaultActions;
}

function Solutions({
  questions,
  numCorrect,
  totalWords,
  markMissed,
  showLexiconSymbols,
  wordVault,
}: SolutionsProps) {
  const [confirmingMarkAll, setConfirmingMarkAll] = useState(false);
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
          vaultStatus={wordVault.enabled ? wordVault.status(question.get('a')) : 'unknown'}
          addToVault={wordVault.add}
          markMissedInVault={wordVault.markMissed}
          vaultCardUrl={`/wordvault/card/${encodeURIComponent(question.get('a'))}?lexicon=${
            encodeURIComponent(wordVault.lexicon)}`}
        />,
      );
      wordIdx += 1;
    });
  });

  const numToChange = wordVault.numToAdd + wordVault.numToMark;

  // The solved questions, which "Mark all missed" would mark missed.
  const solvedQuestions: { idx: number; alphagram: string }[] = [];
  questions.forEach((question) => {
    if (question.get('solved', false)) {
      solvedQuestions.push({ idx: question.get('idx'), alphagram: question.get('a') });
    }
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
      }}
    >
      <div className="row">
        <div
          className="col-lg-12 solutions-stats d-flex align-items-center gap-3 flex-wrap"
          style={{
            padding: '10px 15px',
          }}
        >
          <span>{statsStr}</span>
          {confirmingMarkAll && solvedQuestions.length > 0 ? (
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="small">
                This will mark
                {' '}
                {plural(solvedQuestions.length, 'solved alphagram')}
                {' '}
                as missed in this list. Continue?
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setConfirmingMarkAll(false);
                  markMissed(solvedQuestions);
                }}
              >
                Confirm
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setConfirmingMarkAll(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={solvedQuestions.length === 0}
              onClick={() => setConfirmingMarkAll(true)}
              title="Mark every alphagram missed in this list, including the ones you solved"
            >
              Mark all missed
            </button>
          )}
        </div>
      </div>
      {wordVault.enabled && (
        <div className="row">
          <div className="col-lg-12 d-flex align-items-center gap-3 flex-wrap mt-2 mb-3">
            {wordVault.confirming && numToChange > 0 ? (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="small">
                  This will
                  {' '}
                  {describeAddAllMissed(wordVault)}
                  . Continue?
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={wordVault.addAllMissed}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => wordVault.setConfirming(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={wordVault.busy || numToChange === 0}
                onClick={() => wordVault.setConfirming(true)}
                title="Add missed alphagrams to WordVault, and mark the ones already there as missed"
              >
                {wordVault.busy ? 'Working…' : 'Add missed to WordVault'}
              </button>
            )}
            {wordVault.decks.length > 0 && (
              <label className="d-flex align-items-center gap-2 mb-0 small">
                Add new cards to
                <select
                  className="form-select form-select-sm w-auto"
                  value={wordVault.deckId.toString()}
                  onChange={(e) => wordVault.setDeckId(BigInt(e.target.value))}
                >
                  <option value="0">Default Deck</option>
                  {wordVault.decks.map((d) => (
                    <option key={d.id.toString()} value={d.id.toString()}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <a
              className="ms-auto small"
              href={`/wordvault/?lexicon=${encodeURIComponent(wordVault.lexicon)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open WordVault
              {' '}
              <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
      {wordVault.message && (
        <div className="row">
          <div className="col-lg-12">
            <div className={`alert alert-${wordVault.message.kind} py-2`} role="status">
              {wordVault.message.text}
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-lg-12 table-responsive">
          <table className="table table-sm solutions-table">
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
