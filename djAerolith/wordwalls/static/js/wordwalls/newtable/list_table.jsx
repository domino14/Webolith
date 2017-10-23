/**
 * @fileOverview A table that represents a list of saved lists.
 */

import React from 'react';
import PropTypes from 'prop-types';
import SavedListRow from './list_table_row';

const SavedListTable = (props) => {
  const {
    continueList,
    playFirstMissed,
    resetStartOver,
    deleteList,
    flashcardList,
    flashcardFirstMissed,
  } = props;

  const rows = props.lists.map(option => (
    <SavedListRow
      key={option.id}
      list={option}
      continueList={continueList}
      playFirstMissed={playFirstMissed}
      resetStartOver={resetStartOver}
      deleteList={deleteList}
      flashcardList={flashcardList}
      flashcardFirstMissed={flashcardFirstMissed}
    />
  ));

  return (
    <table
      className="table table-condensed word-list-table"
    >
      <thead>
        <tr>
          <th>Action</th>
          <th>List Name</th>
          <th>Progress</th>
          <th>Total Questions</th>
          <th>Last Saved</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>);
};

SavedListTable.propTypes = {
  lists: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    numCurAlphagrams: PropTypes.number,
    numAlphagrams: PropTypes.number,
    questionIndex: PropTypes.number,
    goneThruOnce: PropTypes.bool,
    lastSaved: PropTypes.string,
    lastSavedDT: PropTypes.string,
  })).isRequired,

  continueList: PropTypes.func.isRequired,
  playFirstMissed: PropTypes.func.isRequired,
  resetStartOver: PropTypes.func.isRequired,
  deleteList: PropTypes.func.isRequired,
  flashcardList: PropTypes.func.isRequired,
  flashcardFirstMissed: PropTypes.func.isRequired,
};

export default SavedListTable;
