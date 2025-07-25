import React from 'react';

import ChallengeResults from './newtable/challenges/challenge_results';
import ModalSkeleton from './modal_skeleton';

interface ChallengeEntry {
  user: string;
  score: number;
  tr: number;
  w: number;
  addl: string;
}

interface ChallengeData {
  entries: ChallengeEntry[];
  maxScore: number;
}

interface ResultsModalProps {
  challengeData: ChallengeData;
  hideErrors: boolean;
}

function ResultsModal({ challengeData, hideErrors }: ResultsModalProps) {
  return (
    <ModalSkeleton
      title="Challenge Results"
      modalClass="challenge-results-modal"
      size="modal-lg"
    >
      <ChallengeResults
        challengeData={challengeData}
        height={500}
        hideErrors={hideErrors}
      />
    </ModalSkeleton>
  );
}

export default ResultsModal;
