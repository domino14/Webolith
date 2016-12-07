import React from 'react';

import ChallengeResults from './challenge_results';
import ModalSkeleton from './modal_skeleton';

const ResultsModal = props => (
  <ModalSkeleton
    title="Challenge Results"
    modalClass="challenge-results-modal"
  >
    <ChallengeResults
      challengeData={props.challengeData}
    />
  </ModalSkeleton>);


ResultsModal.propTypes = {
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
};

export default ResultsModal;

