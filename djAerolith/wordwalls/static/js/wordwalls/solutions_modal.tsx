import React from 'react';

import * as Immutable from 'immutable';

import Solutions from './solutions';
import ModalSkeleton from './modal_skeleton';
import { type ImmutableQuestion } from './immutable-types';
import { WORDVAULT_LEXICA } from 'wordvaultapp/lexica';

import useWordVault from './use_wordvault';
import { useWordVaultReview } from './use_wordvault_review';

interface SolutionsModalProps {
  questions: Immutable.OrderedMap<string, ImmutableQuestion>;
  numCorrect: number;
  totalWords: number;
  markMissed: (questions: { idx: number; alphagram: string }[]) => void;
  showLexiconSymbols: boolean;
  lexicon: string;
  isBuild: boolean;
}

function SolutionsModal({
  questions,
  numCorrect,
  totalWords,
  markMissed,
  showLexiconSymbols,
  lexicon,
  isBuild,
}: SolutionsModalProps) {
  const review = useWordVaultReview();
  // After a WordVault review round, the solutions are where the cards get
  // rated, instead of being added to WordVault.
  const reviewing = review.active
    && (review.session?.status === 'rating' || review.session?.status === 'submitted');
  // In build mode the question is a pool of letters, not an alphagram.
  const wordVault = useWordVault(
    lexicon,
    questions,
    !isBuild && !reviewing && WORDVAULT_LEXICA.includes(lexicon),
  );
  return (
    <ModalSkeleton
      title="Solutions"
      modalClass="solutions-modal"
      size="modal-lg"
      onShown={wordVault.refresh}
    >
      <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Solutions
          questions={questions}
          numCorrect={numCorrect}
          totalWords={totalWords}
          markMissed={markMissed}
          showLexiconSymbols={showLexiconSymbols}
          wordVault={wordVault}
          review={reviewing ? review : null}
        />
      </div>
    </ModalSkeleton>
  );
}

export default SolutionsModal;
