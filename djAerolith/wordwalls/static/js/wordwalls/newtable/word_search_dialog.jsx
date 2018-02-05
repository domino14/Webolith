import React from 'react';
import PropTypes from 'prop-types';

import Select from '../forms/select';
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

      <Select
        colSize={4}
        label="Mode"
        badge="New!"
        selectedValue={props.multiplayerOn ? 'multi' : 'single'}
        options={[{ value: 'single', displayValue: 'Single Player' },
                  { value: 'multi', displayValue: 'Multiplayer' }]}
        onChange={e => props.onMultiplayerModify(e.target.value === 'multi')}
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
  // availableLexica: PropTypes.arrayOf(PropTypes.shape({
  //   id: PropTypes.number,
  //   lexicon: PropTypes.string,
  //   description: PropTypes.string,
  //   counts: PropTypes.object,
  // })),
  // lexicon: PropTypes.number,
  multiplayerOn: PropTypes.bool.isRequired,
  onMultiplayerModify: PropTypes.func.isRequired,
};

export default WordSearchDialog;
