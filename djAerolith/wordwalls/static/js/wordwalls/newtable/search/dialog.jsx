import React from 'react';
import PropTypes from 'prop-types';

import { SearchCriterion } from 'wordvaultapp/search/types';
import SearchRows from './rows';
import HelpText from './help_text';

function PlayButton(props) {
  return (
    <button
      type="button"
      className="btn btn-primary submit-word-search"
      style={{ marginTop: '0.75em' }}
      onClick={props.onSearchSubmit}
      data-dismiss="modal"
      disabled={props.disabled ? 'disabled' : ''}
    >
      Play!
    </button>
  );
}

PlayButton.propTypes = {
  onSearchSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

function FlashcardButton(props) {
  return (
    <button
      type="button"
      className="btn btn-info"
      style={{ marginTop: '0.75em', marginLeft: '1em' }}
      onClick={props.onFlashcardSubmit}
      data-dismiss="modal"
      disabled={props.disabled ? 'disabled' : ''}
    >
      Flashcard
    </button>
  );
}

FlashcardButton.propTypes = {
  onFlashcardSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

function WordSearchDialog(props) {
  const flashcardButton = props.flashcardAllowed ? (
    <FlashcardButton
      onFlashcardSubmit={props.onFlashcardSubmit}
      disabled={props.disabled}
    />
  ) : null;
  return (
    <div className="row" style={{ marginTop: '8px' }}>
      <div className="col-sm-8">
        <SearchRows
          searches={props.searches}
          addSearchRow={props.addSearchRow}
          removeSearchRow={props.removeSearchRow}
          modifySearchType={props.onSearchTypeChange}
          modifySearchParam={props.onSearchParamChange}
          allowedSearchTypes={props.allowedSearchTypes}
        />
        <PlayButton
          onSearchSubmit={props.onSearchSubmit}
          disabled={props.disabled}
        />
        {flashcardButton}
      </div>
      <div
        className="col-sm-4"
        style={{ overflowY: 'scroll', height: 400, marginTop: 32 }}
      >
        <HelpText
          allowedSearchTypes={props.allowedSearchTypes}
        />
      </div>
    </div>
  );
}

WordSearchDialog.defaultProps = {
  flashcardAllowed: true,
  onFlashcardSubmit: () => { },
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
