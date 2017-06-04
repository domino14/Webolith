import React from 'react';
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
        onDropdownClicked={props.onDropdownClicked}
      />
    </td>
    <td>{props.list.name}</td>
    <td>{progressString(props.list.questionIndex, props.list.numCurAlphagrams)}</td>
    <td>{props.list.numAlphagrams}</td>
    <td>{props.list.lastSaved}</td>
  </tr>
);

SavedListRow.propTypes = {
  list: React.PropTypes.shape({
    id: React.PropTypes.number,
    name: React.PropTypes.string,
    numCurAlphagrams: React.PropTypes.number,
    numAlphagrams: React.PropTypes.number,
    questionIndex: React.PropTypes.number,
    goneThruOnce: React.PropTypes.bool,
    lastSaved: React.PropTypes.string,
    lastSavedDT: React.PropTypes.string,
  }),
  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  flashcardList: React.PropTypes.func,
  flashcardFirstMissed: React.PropTypes.func,
  deleteList: React.PropTypes.func,
  onDropdownClicked: React.PropTypes.func,
};

export default SavedListRow;
