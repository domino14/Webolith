import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from './rows';
import { SearchCriterion } from './types';

const WordSearchDialog = props => (
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
      <button
        className="btn btn-primary submit-word-search"
        style={{ marginTop: '0.75em' }}
        onClick={props.onSearchSubmit}
        data-dismiss="modal"
        disabled={props.disabled ? 'disabled' : ''}
      >Play!
      </button>
      <button
        className="btn btn-info"
        style={{ marginTop: '0.75em', marginLeft: '1em' }}
        onClick={props.onFlashcardSubmit}
        data-dismiss="modal"
        disabled={props.disabled ? 'disabled' : ''}
      >Flashcard
      </button>
    </div>
  </div>
);


WordSearchDialog.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  onSearchTypeChange: PropTypes.func.isRequired,
  onSearchParamChange: PropTypes.func.isRequired,
  addSearchRow: PropTypes.func.isRequired,
  removeSearchRow: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onFlashcardSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

export default WordSearchDialog;