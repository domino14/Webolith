/**
 * @fileOverview A table that represents a list of saved lists.
 */

import React from 'react';

import SavedListRow from './list_table_row';

const SavedListTable = (props) => {
  const continueList = props.continueList;
  const playFirstMissed = props.playFirstMissed;
  const resetStartOver = props.resetStartOver;
  const deleteList = props.deleteList;
  const flashcardList = props.flashcardList;
  const flashcardFirstMissed = props.flashcardFirstMissed;

  const rows = props.lists.map((option, idx) => (
    <SavedListRow
      key={idx}
      pos={idx}
      total={props.lists.length}
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
  lists: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    name: React.PropTypes.string,
    numCurAlphagrams: React.PropTypes.number,
    numAlphagrams: React.PropTypes.number,
    questionIndex: React.PropTypes.number,
    goneThruOnce: React.PropTypes.bool,
    lastSaved: React.PropTypes.string,
    lastSavedDT: React.PropTypes.string,
  })),

  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,
  flashcardList: React.PropTypes.func,
  flashcardFirstMissed: React.PropTypes.func,
};

export default SavedListTable;
