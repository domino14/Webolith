/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events,jsx-a11y/anchor-is-valid,
jsx-a11y/interactive-supports-focus */ // goddamn a11y

import React, { useEffect, useRef, useCallback } from 'react';

interface PlayButtonProps {
  continueList: (listID: number) => void;
  playFirstMissed: (listID: number) => void;
  resetStartOver: (listID: number) => void;
  deleteList: (listID: number) => void;
  flashcardList: (listID: number) => void;
  flashcardFirstMissed: (listID: number) => void;
  listID: number;
  goneThruOnce: boolean;
}

function PlayButton({
  continueList,
  playFirstMissed,
  resetStartOver,
  deleteList,
  flashcardList,
  flashcardFirstMissed,
  listID,
  goneThruOnce,
}: PlayButtonProps) {
  const btnGroupNodeRef = useRef<HTMLDivElement>(null);

  // Create curried click handlers
  const handleContinueList = useCallback(() => {
    continueList(listID);
  }, [continueList, listID]);

  const handlePlayFirstMissed = useCallback(() => {
    playFirstMissed(listID);
  }, [playFirstMissed, listID]);

  const handleResetStartOver = useCallback(() => {
    resetStartOver(listID);
  }, [resetStartOver, listID]);

  const handleDeleteList = useCallback(() => {
    deleteList(listID);
  }, [deleteList, listID]);

  const handleFlashcardList = useCallback(() => {
    flashcardList(listID);
  }, [flashcardList, listID]);

  const handleFlashcardFirstMissed = useCallback(() => {
    flashcardFirstMissed(listID);
  }, [flashcardFirstMissed, listID]);

  useEffect(() => {
    const btnGroupNode = btnGroupNodeRef.current;
    if (!btnGroupNode) return undefined;

    // Use Bootstrap 5 dropdown events for positioning logic
    const handleDropdownShow = () => {
      const tableScroller = btnGroupNode.closest('.table-scroller');
      const dropdownMenu = btnGroupNode.querySelector('.dropdown-menu');
      const dropdownButton = btnGroupNode.querySelector('.dropdown-toggle');
      const listTableRow = btnGroupNode.closest('.list-table-row');
      
      if (!tableScroller || !dropdownMenu || !dropdownButton || !listTableRow) {
        return;
      }

      // Calculate positions using getBoundingClientRect for more reliable measurements
      const tableScrollerRect = tableScroller.getBoundingClientRect();
      const listTableRowRect = listTableRow.getBoundingClientRect();
      const dropdownMenuRect = dropdownMenu.getBoundingClientRect();
      const dropdownButtonRect = dropdownButton.getBoundingClientRect();

      const ulOffsetTop = listTableRowRect.top - tableScrollerRect.top + 
                         (dropdownMenuRect.top - listTableRowRect.top);
      const spaceUp = ulOffsetTop - dropdownButtonRect.height - dropdownMenuRect.height;
      const spaceDown = tableScrollerRect.height - (ulOffsetTop + dropdownMenuRect.height);

      if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) {
        btnGroupNode.classList.add('dropup');
      }
    };

    const handleDropdownHide = () => {
      btnGroupNode.classList.remove('dropup');
    };

    // Add Bootstrap 5 event listeners
    btnGroupNode.addEventListener('show.bs.dropdown', handleDropdownShow);
    btnGroupNode.addEventListener('hidden.bs.dropdown', handleDropdownHide);

    return () => {
      btnGroupNode.removeEventListener('show.bs.dropdown', handleDropdownShow);
      btnGroupNode.removeEventListener('hidden.bs.dropdown', handleDropdownHide);
    };
  }, []);

  return (
    <div
      className="btn-group dropdown"
      ref={btnGroupNodeRef}
    >
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={handleContinueList}
      >
        Continue
      </button>
      <button
        type="button"
        className="btn btn-primary dropdown-toggle btn-sm"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <span className="caret" />
      </button>

      <ul className="dropdown-menu">

        {goneThruOnce ? (
          <li>
            <a role="button" onClick={handlePlayFirstMissed}>
              Play first missed
            </a>
          </li>
        ) : null}

        <li>
          <a role="button" onClick={handleResetStartOver}>
            Reset and start over
          </a>
        </li>

        <li role="separator" className="divider" />

        <li>
          <a role="button" onClick={handleFlashcardList}>
            Flashcard entire list
          </a>
        </li>

        {goneThruOnce ? (
          <li>
            <a role="button" onClick={handleFlashcardFirstMissed}>
              Flashcard first missed
            </a>
          </li>
        ) : null}

        <li role="separator" className="divider" />

        <li>
          <a role="button" onClick={handleDeleteList}>
            <span className="text-danger">Delete</span>
          </a>
        </li>

      </ul>
    </div>
  );
}

export default PlayButton;
