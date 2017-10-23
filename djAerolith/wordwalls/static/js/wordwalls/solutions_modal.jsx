import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

import Solutions from './solutions';
import ModalSkeleton from './modal_skeleton';

const SolutionsModal = props => (
  <ModalSkeleton
    title="Solutions"
    modalClass="solutions-modal"
    size="modal-lg"
  >
    <div className="modal-body" style={{ height: '80vh', overflowY: 'auto' }} >
      <Solutions
        questions={props.questions}
        numCorrect={props.numCorrect}
        totalWords={props.totalWords}
        height={props.height}
        markMissed={props.markMissed}
        showLexiconSymbols={props.showLexiconSymbols}
      />
    </div>
  </ModalSkeleton>);


SolutionsModal.propTypes = {
  questions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
  numCorrect: PropTypes.number.isRequired,
  totalWords: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  markMissed: PropTypes.func.isRequired,
  showLexiconSymbols: PropTypes.bool.isRequired,
};

export default SolutionsModal;

