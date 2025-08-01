import React from 'react';

import { SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';
import SearchRows from './rows';
import HelpText from './help_text';

interface PlayButtonProps {
  onSearchSubmit: () => void;
  disabled: boolean;
}

function PlayButton({ onSearchSubmit, disabled }: PlayButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-primary submit-word-search"
      style={{ marginTop: '0.75em' }}
      onClick={onSearchSubmit}
      data-bs-dismiss="modal"
      disabled={disabled}
    >
      Play!
    </button>
  );
}

interface FlashcardButtonProps {
  onFlashcardSubmit: () => void;
  disabled: boolean;
}

function FlashcardButton({ onFlashcardSubmit, disabled }: FlashcardButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-info"
      style={{ marginTop: '0.75em', marginLeft: '1em' }}
      onClick={onFlashcardSubmit}
      data-bs-dismiss="modal"
      disabled={disabled}
    >
      Flashcard
    </button>
  );
}

interface WordSearchDialogProps {
  searches: SearchCriterion[];
  onSearchTypeChange: (index: number, value: string) => void;
  onSearchParamChange: (index: number, paramName: string, paramValue: string | number) => void;
  addSearchRow: () => void;
  removeSearchRow: (index: number) => void;
  onSearchSubmit: () => void;
  onFlashcardSubmit?: () => void;
  flashcardAllowed?: boolean;
  disabled: boolean;
  allowedSearchTypes: Set<SearchTypesEnum>;
  darkMode?: boolean;
}

function WordSearchDialog({
  searches,
  onSearchTypeChange,
  onSearchParamChange,
  addSearchRow,
  removeSearchRow,
  onSearchSubmit,
  onFlashcardSubmit = () => {},
  flashcardAllowed = true,
  disabled,
  allowedSearchTypes,
  darkMode = false,
}: WordSearchDialogProps) {
  const flashcardButton = flashcardAllowed ? (
    <FlashcardButton
      onFlashcardSubmit={onFlashcardSubmit}
      disabled={disabled}
    />
  ) : null;

  return (
    <div className="row" style={{ marginTop: '8px' }}>
      <div className="col-sm-8">
        <SearchRows
          searches={searches}
          addSearchRow={addSearchRow}
          removeSearchRow={removeSearchRow}
          modifySearchType={onSearchTypeChange}
          modifySearchParam={onSearchParamChange}
          allowedSearchTypes={allowedSearchTypes}
        />
        <PlayButton
          onSearchSubmit={onSearchSubmit}
          disabled={disabled}
        />
        {flashcardButton}
      </div>
      <div
        className="col-sm-4"
        style={{ overflowY: 'scroll', height: 400, marginTop: 32 }}
      >
        <HelpText
          allowedSearchTypes={allowedSearchTypes}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}

export default WordSearchDialog;
