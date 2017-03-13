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
    <div className="modal-body">
      <Solutions
        questions={props.questions}
        answeredByMe={props.answeredByMe}
        totalWords={props.totalWords}
        height={props.height}
        markMissed={props.markMissed}
        showLexiconSymbols={props.showLexiconSymbols}
      />
    </div>
  </ModalSkeleton>);


SolutionsModal.propTypes = {
  questions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
};

export default SolutionsModal;

