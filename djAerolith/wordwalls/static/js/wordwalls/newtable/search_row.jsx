import React from 'react';
import PropTypes from 'prop-types';

import Select from '../forms/select';
import NumberInput from '../forms/number_input';
import TextInput from '../forms/text_input';

const SearchTypesEnum = {
  PROBABILITY: 1,
  LENGTH: 2,
  TAGS: 3,
  POINTS: 4,
  NUM_ANAGRAMS: 5,
  NUM_VOWELS: 6,
  properties: {
    1: {
      name: 'probability_range',
      displayName: 'Probability Range',
      defaultMin: 1,
      defaultMax: 100,
      minAllowed: 1,
      maxAllowed: 70000, // Subject to change by lexicon
    },
    2: {
      name: 'length',
      displayName: 'Word Length',
      defaultMin: 2,
      defaultMax: 15,
      minAllowed: 2,
      maxAllowed: 15,
    },
    3: { name: 'has_tags', displayName: 'Has Tags' },
    4: {
      name: 'point_value',
      displayName: 'Point Value',
      defaultMin: 2,
      defaultMax: 99,
      minAllowed: 2,
      maxAllowed: 15,
    },
    5: {
      name: 'number_anagrams',
      displayName: 'Number of Anagrams',
      defaultMin: 1,
      defaultMax: 99,
      minAllowed: 1,
      maxAllowed: 99,
    },
    6: {
      name: 'number_vowels',
      displayName: 'Number of Vowels',
      defaultMin: 0,
      defaultMax: 15,
      minAllowed: 0,
      maxAllowed: 15,
    },
  },
};

const SearchTypesOrder = [
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.TAGS,
];

function searchCriteriaOptions() {
  return SearchTypesOrder.map(el => ({
    value: String(el),
    displayValue: SearchTypesEnum.properties[el].displayName,
  }));
}

/**
 * Given a list of word search criteria, figure out the next one to add,
 * based on the order.
 * @param {Array.<Object>} wordSearchCriteria
 * @return {Object?} A new search type criterion, or null.
 */
function searchCriterionToAdd(wordSearchCriteria) {
  const stmap = {};
  wordSearchCriteria.forEach((criteria) => {
    // These are enum integers.
    stmap[criteria.searchType] = true;
  });
  // Find the first search type that's not in the map.
  const newtypeId = SearchTypesOrder.find(tid => stmap[tid] == null);
  if (!newtypeId) {
    return null;
  }
  if (newtypeId === SearchTypesEnum.TAGS) {
    return {
      searchType: newtypeId,
      valueList: '',
    };
  }
  return {
    searchType: newtypeId,
    minValue: SearchTypesEnum.properties[newtypeId].defaultMin,
    maxValue: SearchTypesEnum.properties[newtypeId].defaultMax,
  };
}

class SearchRow extends React.Component {
  renderMinMax() {
    return (
      <div style={{ marginTop: '2px' }}>
        <div className="col-sm-3">
          <NumberInput
            colSize={12}
            label="Min"
            value={String(this.props.minValue)}
            minAllowed={String(this.props.minAllowedValue)}
            maxAllowed={String(this.props.maxAllowedValue)}
            onChange={event => this.props.modifySearchParam(
              this.props.index,
              'minValue', event.target.value,
            )}
          />
        </div>
        <div className="col-sm-3">
          <NumberInput
            colSize={12}
            label="Max"
            value={String(this.props.maxValue)}
            minAllowed={String(this.props.minAllowedValue)}
            maxAllowed={String(this.props.maxAllowedValue)}
            onChange={event => this.props.modifySearchParam(
              this.props.index,
              'maxValue', event.target.value,
            )}
          />
        </div>
      </div>
    );
  }

  renderListValue() {
    return (
      <div className="col-sm-6" style={{ marginTop: '2px' }}>
        <TextInput
          colSize={12}
          label="Comma-separated values"
          value={this.props.valueList}
          onChange={event => this.props.modifySearchParam(
            this.props.index,
            'valueList', event.target.value,
          )}
        />
      </div>
    );
  }

  render() {
    let specificForm;
    switch (this.props.searchType) {
      case SearchTypesEnum.PROBABILITY:
      case SearchTypesEnum.POINTS:
      case SearchTypesEnum.LENGTH:
      case SearchTypesEnum.NUM_VOWELS:
      case SearchTypesEnum.NUM_ANAGRAMS:
        specificForm = this.renderMinMax();
        break;
      case SearchTypesEnum.TAGS:
        specificForm = this.renderListValue();
        break;
      default:
        break;
    }

    return (
      <div className="row">
        <div className="col-xs-1" style={{ marginTop: '33px', marginBottom: '5px' }}>
          <button
            className="btn btn-info btn-sm"
            onClick={this.props.addRow}
          >＋
          </button>
        </div>
        <div className="col-xs-1" style={{ marginTop: '33px', marginBottom: '5px' }}>
          <button
            className="btn btn-info btn-sm"
            onClick={() => this.props.removeRow(this.props.index)}
            disabled={this.props.removeDisabled}
          >－
          </button>
        </div>
        <div className="col-sm-4">
          <Select
            colSize={12}
            label="Search Criterion"
            selectedValue={String(this.props.searchType)}
            options={searchCriteriaOptions()}
            onChange={(event) => {
              this.props.modifySearchType(this.props.index, event.target.value);
            }}
          />
        </div>
        {specificForm}
      </div>
    );
  }
}

SearchRow.propTypes = {
  searchType: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  minValue: PropTypes.number,
  minAllowedValue: PropTypes.number,
  maxValue: PropTypes.number,
  maxAllowedValue: PropTypes.number,
  valueList: PropTypes.string,
  addRow: PropTypes.func.isRequired,
  removeRow: PropTypes.func.isRequired,
  removeDisabled: PropTypes.bool.isRequired,
  modifySearchType: PropTypes.func.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
};

SearchRow.defaultProps = {
  minValue: 1,
  minAllowedValue: 1,
  maxValue: 100,
  maxAllowedValue: 100,
  valueList: '',
};

export default SearchRow;
export { SearchTypesEnum, searchCriterionToAdd };

