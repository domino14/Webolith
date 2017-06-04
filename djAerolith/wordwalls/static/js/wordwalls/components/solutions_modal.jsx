import React from 'react';
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
  questions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  numCorrect: React.PropTypes.number,
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
};

export default SolutionsModal;

