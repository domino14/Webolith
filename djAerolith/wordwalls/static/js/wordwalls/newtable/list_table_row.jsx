import React from 'react';
import PropTypes from 'prop-types';

import PlayButton from './play_button';


function progressString(questionIndex, totalQuestions) {
  let displayedQuestionIndex = questionIndex;
  if (questionIndex > totalQuestions) {
    displayedQuestionIndex = totalQuestions;
  }
  return `${displayedQuestionIndex} / ${totalQuestions}`;
}

const SavedListRow = props => (
  <tr
    className={`list-table-row ${props.list.goneThruOnce ? 'success' : ''}`}
  >
    <td>
      <PlayButton
        listID={props.list.id}
        goneThruOnce={props.list.goneThruOnce}
        continueList={props.continueList}
        playFirstMissed={props.playFirstMissed}
        resetStartOver={props.resetStartOver}
        flashcardList={props.flashcardList}
        flashcardFirstMissed={props.flashcardFirstMissed}
        deleteList={props.deleteList}
      />
    </td>
    <td>{props.list.name}</td>
    <td>{progressString(props.list.questionIndex, props.list.numCurAlphagrams)}</td>
    <td>{props.list.numAlphagrams}</td>
    <td>{props.list.lastSaved}</td>
  </tr>
);

SavedListRow.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    numCurAlphagrams: PropTypes.number,
    numAlphagrams: PropTypes.number,
    questionIndex: PropTypes.number,
    goneThruOnce: PropTypes.bool,
    lastSaved: PropTypes.string,
    lastSavedDT: PropTypes.string,
  }).isRequired,
  continueList: PropTypes.func.isRequired,
  playFirstMissed: PropTypes.func.isRequired,
  resetStartOver: PropTypes.func.isRequired,
  flashcardList: PropTypes.func.isRequired,
  flashcardFirstMissed: PropTypes.func.isRequired,
  deleteList: PropTypes.func.isRequired,
};

export default SavedListRow;
