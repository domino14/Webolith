import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from './rows';
import HelpText from './help_text';
import { SearchCriterion } from './types';

const PlayButton = (props) => (
  <button
    type="button"
    className="btn btn-primary submit-word-search"
    style={{ marginTop: '0.75em' }}
    onClick={props.onSearchSubmit}
    data-bs-dismiss="modal"
    disabled={props.disabled ? 'disabled' : ''}
  >
    Play!
  </button>
);

PlayButton.propTypes = {
  onSearchSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

const FlashcardButton = (props) => (
  <button
    type="button"
    className="btn btn-info"
    style={{ marginTop: '0.75em', marginLeft: '1em' }}
    onClick={props.onFlashcardSubmit}
    data-bs-dismiss="modal"
    disabled={props.disabled ? 'disabled' : ''}
  >
    Flashcard
  </button>
);

FlashcardButton.propTypes = {
  onFlashcardSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

const WordSearchDialog = (props) => {
  const flashcardButton = props.flashcardAllowed ? (
    <FlashcardButton
      onFlashcardSubmit={props.onFlashcardSubmit}
      disabled={props.disabled}
    />
  ) : null;
  return (
    <div className="row mt-1">
      <div className="col-sm-7">
        <SearchRows
          searches={props.searches}
          addSearchRow={props.addSearchRow}
          removeSearchRow={props.removeSearchRow}
          modifySearchType={props.onSearchTypeChange}
          modifySearchParam={props.onSearchParamChange}
          allowedSearchTypes={props.allowedSearchTypes}
        />
        <div className="mt-4">
          <PlayButton
            onSearchSubmit={props.onSearchSubmit}
            disabled={props.disabled}
          />
          {flashcardButton}
        </div>
      </div>
      <div
        className="col-sm-5 mt-4 pt-5"
        style={{ overflowY: 'scroll', height: 600 }}
      >
        <HelpText
          allowedSearchTypes={props.allowedSearchTypes}
        />
      </div>
    </div>
  );
};

WordSearchDialog.defaultProps = {
  flashcardAllowed: true,
  onFlashcardSubmit: () => {},
};

WordSearchDialog.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  onSearchTypeChange: PropTypes.func.isRequired,
  onSearchParamChange: PropTypes.func.isRequired,
  addSearchRow: PropTypes.func.isRequired,
  removeSearchRow: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onFlashcardSubmit: PropTypes.func,
  flashcardAllowed: PropTypes.bool,
  disabled: PropTypes.bool.isRequired,
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

export default WordSearchDialog;
