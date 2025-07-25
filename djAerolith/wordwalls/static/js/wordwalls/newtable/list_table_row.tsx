import React from 'react';

import PlayButton from './play_button';

function progressString(questionIndex: number, totalQuestions: number): string {
  let displayedQuestionIndex = questionIndex;
  if (questionIndex > totalQuestions) {
    displayedQuestionIndex = totalQuestions;
  }
  return `${displayedQuestionIndex} / ${totalQuestions}`;
}

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

interface SavedListRowProps {
  list: SavedList;
  continueList: (listID: number) => () => void;
  playFirstMissed: (listID: number) => () => void;
  resetStartOver: (listID: number) => () => void;
  flashcardList: (listID: number) => () => void;
  flashcardFirstMissed: (listID: number) => () => void;
  deleteList: (listID: number) => () => void;
}

function SavedListRow({
  list,
  continueList,
  playFirstMissed,
  resetStartOver,
  flashcardList,
  flashcardFirstMissed,
  deleteList,
}: SavedListRowProps) {
  return (
    <tr
      className={`list-table-row ${list.goneThruOnce ? 'bg-success' : ''}`}
    >
      <td>
        <PlayButton
          listID={list.id}
          goneThruOnce={list.goneThruOnce}
          continueList={continueList}
          playFirstMissed={playFirstMissed}
          resetStartOver={resetStartOver}
          flashcardList={flashcardList}
          flashcardFirstMissed={flashcardFirstMissed}
          deleteList={deleteList}
        />
      </td>
      <td>{list.name}</td>
      <td>{progressString(list.questionIndex, list.numCurAlphagrams)}</td>
      <td>{list.numAlphagrams}</td>
      <td>{list.lastSaved}</td>
    </tr>
  );
}

export default SavedListRow;
