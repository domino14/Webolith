import React from 'react';

import * as Immutable from 'immutable';

import Solutions from './solutions';
import ModalSkeleton from './modal_skeleton';
import { type ImmutableQuestion } from './immutable-types';

interface SolutionsModalProps {
  questions: Immutable.OrderedMap<string, ImmutableQuestion>;
  numCorrect: number;
  totalWords: number;
  markMissed: (idx: number, alphagram: string) => void;
  showLexiconSymbols: boolean;
}

function SolutionsModal({
  questions,
  numCorrect,
  totalWords,
  markMissed,
  showLexiconSymbols,
}: SolutionsModalProps) {
  return (
    <ModalSkeleton title="Solutions" modalClass="solutions-modal" size="modal-lg">
      <div className="modal-body" style={{ height: '80vh', overflowY: 'auto' }}>
        <Solutions
          questions={questions}
          numCorrect={numCorrect}
          totalWords={totalWords}
          markMissed={markMissed}
          showLexiconSymbols={showLexiconSymbols}
        />
      </div>
    </ModalSkeleton>
  );
}

export default SolutionsModal;
