import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from './search_rows';

const WordSearchDialog = props => (
  <div className="row" style={{ marginTop: '8px' }}>
    <div className="col-sm-8">
      <SearchRows
        searches={props.searches}
        addSearchRow={props.addSearchRow}
        removeSearchRow={props.removeSearchRow}
        modifySearchType={props.onSearchTypeChange}
        modifySearchParam={props.onSearchParamChange}
      />
      <button
        className="btn btn-primary"
        style={{ marginTop: '0.75em' }}
        onClick={props.onSearchSubmit}
        data-dismiss="modal"
      >Play!
      </button>
      <button
        className="btn btn-info"
        style={{ marginTop: '0.75em', marginLeft: '1em' }}
        onClick={props.onFlashcardSubmit}
        data-dismiss="modal"
      >Flashcard
      </button>
    </div>
  </div>
);


WordSearchDialog.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.shape({
    searchType: PropTypes.number,
    minValue: PropTypes.number,
    maxValue: PropTypes.number,
    minAllowedValue: PropTypes.number,
    maxAllowedValue: PropTypes.number,
    valueList: PropTypes.string,
  })).isRequired,
  onSearchTypeChange: PropTypes.func.isRequired,
  onSearchParamChange: PropTypes.func.isRequired,
  addSearchRow: PropTypes.func.isRequired,
  removeSearchRow: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  onFlashcardSubmit: PropTypes.func.isRequired,
};

export default WordSearchDialog;
