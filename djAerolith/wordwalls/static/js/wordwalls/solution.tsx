import React from 'react';

import WordPartDisplay from './word_part_display';
import { type VaultStatus } from './use_wordvault';
import { RATING_LABELS, Score } from './wordvault_review';

// Styled in theme-enhancements.css.
const RATING_BUTTON_CLASS: Record<number, string> = {
  [Score.AGAIN]: 'wv-rating-again',
  [Score.HARD]: 'wv-rating-hard',
  [Score.GOOD]: 'wv-rating-good',
  [Score.EASY]: 'wv-rating-easy',
};

const formatDue = (due: Date) => due.toLocaleDateString(undefined, {
  month: 'short', day: 'numeric',
});

interface RatingCellProps {
  rating: Score;
  // Unset once the ratings are sent.
  onRate?: (score: Score) => void;
  // After sending: when the card is next due, or null if it wasn't scored.
  result?: Date | null;
}

function RatingCell({ rating, onRate, result }: RatingCellProps) {
  if (result !== undefined) {
    const label = RATING_LABELS.find(([s]) => s === rating)?.[1];
    return result === null ? (
      <span className="small text-body-secondary" title="Just reviewed, or no longer in WordVault.">
        Not scored
      </span>
    ) : (
      <span className="small text-nowrap" title={`Scored ${label}.`}>
        {`${label} · due ${formatDue(result)}`}
      </span>
    );
  }
  return (
    <div className="btn-group btn-group-sm wv-rating" role="group" aria-label="WordVault rating">
      {RATING_LABELS.map(([score, label]) => {
        return (
          <button
            key={score}
            type="button"
            className={`btn py-0 px-1 ${RATING_BUTTON_CLASS[score]}`}
            aria-pressed={score === rating}
            disabled={!onRate}
            onClick={() => onRate?.(score)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// How each WordVault status looks in the actions column. 'unknown' has no
// icon: WordVault isn't available for this question.
const VAULT_STATUS_DISPLAY: Record<VaultStatus, { icon: string; title: string } | null> = {
  unknown: null,
  absent: {
    icon: 'bi-plus-circle text-body-secondary',
    title: 'Not in WordVault.',
  },
  inVault: {
    icon: 'bi-safe2 text-primary',
    title: 'In WordVault.',
  },
  pending: {
    icon: '',
    title: 'Saving to WordVault…',
  },
  added: {
    icon: 'bi-check-circle-fill text-success',
    title: 'Added to WordVault.',
  },
  markedMissed: {
    icon: 'bi-arrow-counterclockwise text-danger',
    title: 'Marked missed in WordVault (scored Again).',
  },
};

interface SolutionProps {
  markMissed: (questions: { idx: number; alphagram: string }[]) => void;
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
  vaultStatus: VaultStatus;
  addToVault: (alphagram: string) => void;
  markMissedInVault: (alphagram: string) => void;
  vaultCardUrl: string;
  // Set in a WordVault review round: this card's rating.
  reviewRating?: Score;
  onRate?: (alphagram: string, score: Score) => void;
  reviewResult?: Date | null;
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
  vaultStatus,
  addToVault,
  markMissedInVault,
  vaultCardUrl,
  reviewRating,
  onRate,
  reviewResult,
}: SolutionProps) {
  const handleMarkMissed = () => {
    markMissed([{ idx, alphagram }]);
  };

  let qTdClass = '';
  let wTdClass = 'text-nowrap';
  let rowStyle: React.CSSProperties = {};

  if (!correct) {
    qTdClass = 'table-danger';
  } else if (wrongGuess) {
    qTdClass = 'table-warning';
  }
  if (!wordSolved) {
    wTdClass += ' table-danger';
  }
  const wordDisplay = (innerFrontHook ? '･' : '') + word + (innerBackHook ? '･' : '') + lexiconSymbols;

  let actionsCell: React.ReactNode = null;
  if (wordPos === 0 && reviewRating !== undefined) {
    actionsCell = (
      <RatingCell
        rating={reviewRating}
        onRate={onRate ? (score) => onRate(alphagram, score) : undefined}
        result={reviewResult}
      />
    );
  } else if (wordPos === 0) {
    const vault = VAULT_STATUS_DISPLAY[vaultStatus];
    const items: { label: string; onClick?: () => void; href?: string }[] = [];
    if (correct) {
      items.push({ label: 'Mark missed in this list', onClick: handleMarkMissed });
    }
    if (vaultStatus === 'absent') {
      items.push({ label: 'Add to WordVault', onClick: () => addToVault(alphagram) });
    } else if (vaultStatus === 'inVault') {
      items.push({
        label: 'Mark missed in WordVault',
        onClick: () => markMissedInVault(alphagram),
      });
    }
    if (vaultStatus === 'inVault' || vaultStatus === 'added' || vaultStatus === 'markedMissed') {
      items.push({ label: 'View card in WordVault', href: vaultCardUrl });
    }
    const icon = vault ? (
      <i className={`bi fs-5 ${vault.icon}`} aria-hidden="true" />
    ) : (
      <i className="bi fs-5 bi-three-dots" aria-hidden="true" />
    );
    const title = vault ? vault.title : 'Actions';

    if (vaultStatus === 'pending') {
      actionsCell = (
        <span
          className="spinner-border spinner-border-sm text-body-secondary"
          role="status"
          title={title}
        />
      );
    } else if (items.length === 0) {
      actionsCell = vault ? <span title={title}>{icon}</span> : null;
    } else {
      actionsCell = (
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-link p-0 text-decoration-none"
            data-bs-toggle="dropdown"
            // The table scrolls, which would clip an absolutely positioned menu.
            data-bs-popper-config='{"strategy":"fixed"}'
            aria-expanded="false"
            title={`${title} Click for actions.`}
            aria-label={title}
          >
            {icon}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            {items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a
                    className="dropdown-item"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                    {' '}
                    <i className="bi bi-box-arrow-up-right small" aria-hidden="true" />
                  </a>
                ) : (
                  <button type="button" className="dropdown-item" onClick={item.onClick}>
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }
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
      <td style={rowStyle} className="text-center">
        {actionsCell}
      </td>
    </tr>
  );
}

export default Solution;
