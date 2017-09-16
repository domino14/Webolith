import React from 'react';

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
    1: { name: 'probability_range', displayName: 'Probability Range' },
    2: { name: 'length', displayName: 'Word Length' },
    3: { name: 'has_tags', displayName: 'Has Tags' },
    4: { name: 'point_value', displayName: 'Point Value' },
    5: { name: 'number_anagrams', displayName: 'Number of Anagrams' },
    6: { name: 'number_vowels', displayName: 'Number of Vowels' },
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
    value: SearchTypesEnum.properties[el].name,
    displayValue: SearchTypesEnum.properties[el].displayName,
  }));
}

/**
 * Given a list of word search criteria, figure out the next one to add,
 * based on the order.
 * @param {Array.<Object>} wordSearchCriteria
 * @return {Object?} A new search type criterion, or null.
 */
function searchCriteriaToAdd(wordSearchCriteria) {
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
      valueList: [],
    };
  }
  return {
    searchType: newtypeId,
    minValue: 1,
    maxValue: 100,
  };
}

class SearchRow extends React.Component {
  renderMinMax() {
    return (
      <div>
        <NumberInput
          colSize={4}
          label="Min"
          value={this.props.minValue}
          onChange={() => {}}
        />
        <NumberInput
          colSize={4}
          label="Max"
          value={this.props.maxValue}
          onChange={() => {}}
        />
      </div>
    );
  }

  renderListValue() {
    return (
      <div>
        <TextInput
          colSize={4}
          label="Comma-separated values"
          value={this.props.valueList.join(', ')}
          onChange={() => {}}
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
    console.log('For this search row, search type is', this.props.searchType);
    return (
      <div className="row">
        <div className="col-lg-12">
          <button
            className="btn btn-info"
            onClick={this.props.addRow}
          >+</button>
          <button
            className="btn btn-info"
            onClick={() => this.props.removeRow(this.props.index)}
            disabled={this.props.removeDisabled}
          >-</button>
          <Select
            colSize={4}
            label="Search Criterion"
            selectedValue={SearchTypesEnum.properties[this.props.searchType].name}
            options={searchCriteriaOptions()}
          />
          {specificForm}
        </div>

      </div>
    );
  }
}

SearchRow.propTypes = {
  searchType: React.PropTypes.number,
  index: React.PropTypes.number,
  minValue: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  valueList: React.PropTypes.arrayOf(React.PropTypes.string),
  addRow: React.PropTypes.func,
  removeRow: React.PropTypes.func,
  removeDisabled: React.PropTypes.bool,
};

export default SearchRow;
export { SearchTypesEnum, searchCriteriaToAdd };

