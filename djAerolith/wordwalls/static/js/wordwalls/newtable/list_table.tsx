/**
 * @fileOverview A table that represents a list of saved lists.
 */

import React from 'react';
import SavedListRow from './list_table_row';

interface SavedList {
  id: number;
  name: string;
  numCurAlphagrams: number;
  numAlphagrams: number;
  questionIndex: number;
  goneThruOnce: boolean;
  lastSaved: string;
  lastSavedDT: string;
}

interface SavedListTableProps {
  lists: SavedList[];
  continueList: (listId: number) => void;
  playFirstMissed: (listId: number) => void;
  resetStartOver: (listId: number) => void;
  deleteList: (listId: number) => void;
  flashcardList: (listId: number) => void;
  flashcardFirstMissed: (listId: number) => void;
}

function SavedListTable({
  lists,
  continueList,
  playFirstMissed,
  resetStartOver,
  deleteList,
  flashcardList,
  flashcardFirstMissed,
}: SavedListTableProps) {
  const rows = lists.map((option) => (
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
    <table className="table table-sm word-list-table">
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
    </table>
  );
}

export default SavedListTable;
