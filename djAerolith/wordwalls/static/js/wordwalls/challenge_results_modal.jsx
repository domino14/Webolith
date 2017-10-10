import React from 'react';
import PropTypes from 'prop-types';

import ChallengeResults from './challenge_results';
import ModalSkeleton from './modal_skeleton';

const ResultsModal = props => (
  <ModalSkeleton
    title="Challenge Results"
    modalClass="challenge-results-modal"
    size="modal-lg"
  >
    <ChallengeResults
      challengeData={props.challengeData}
      height={500}
    />
  </ModalSkeleton>);


ResultsModal.propTypes = {
  challengeData: PropTypes.shape({
    entries: PropTypes.array,
    maxScore: PropTypes.number,
  }).isRequired,
};

export default ResultsModal;

