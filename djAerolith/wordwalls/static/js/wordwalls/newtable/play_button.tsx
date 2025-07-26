/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events,jsx-a11y/anchor-is-valid,
jsx-a11y/interactive-supports-focus */ // goddamn a11y

import React, { useEffect, useRef, useCallback } from 'react';

import $ from 'jquery';

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

    // This is a bit of a hack to make sure the dropdown turns into
    // a dropup if there is no space. Adapted from a StackOverflow answer.
    const $tableScroller = $(btnGroupNode).parents('.table-scroller');
    $(btnGroupNode).on('shown.bs.dropdown', function checkDropdown() {
      // calculate the required sizes, spaces
      const $ul = $(this).children('.dropdown-menu');
      const $button = $(this).children('.dropdown-toggle');
      // Ugh, the position of the <tr>, plus the offset of the UL relative
      // to the dropdown toggle button.
      const ulOffsetTop = $ul.parents('.list-table-row').position().top
        + $ul.position().top;
      // how much space would be left on the top if the dropdown opened that
      // direction
      const spaceUp = ulOffsetTop - $button.height() - $ul.height();
      // how much space is left at the bottom
      const spaceDown = $tableScroller.height() - (ulOffsetTop + $ul.height());
      // switch to dropup only if there is no space at the bottom
      // AND there is space at the top, or there isn't either but it
      // would be still better fit
      if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) {
        $(this).addClass('dropup');
      }
    }).on('hidden.bs.dropdown', '.dropdown', function hhidden() {
      // always reset after close
      $(this).removeClass('dropup');
    });

    return () => {
      $(btnGroupNode).off();
    };
  }, []);

  return (
    <div
      className="btn-group dropdown"
      ref={btnGroupNodeRef}
    >
      <button
        type="button"
        className="btn btn-primary btn-xs"
        onClick={handleContinueList}
      >
        Continue
      </button>
      <button
        type="button"
        className="btn btn-primary dropdown-toggle btn-xs"
        data-toggle="dropdown"
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
