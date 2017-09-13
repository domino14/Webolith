import React from 'react';

import Select from '../forms/select';
import NumberInput from '../forms/number_input';
import TextInput from '../forms/text_input';

const SearchTypes = {
  probability: 'probability_range',
  length: 'length',
  tags: 'has_tags',
  points: 'point_value',
  numAnagrams: 'number_anagrams',
  numVowels: 'number_vowels',
};

const SearchTypesDisplay = {
  probability: 'Probability Range',
  length: 'Length',
  tags: 'Has Tags',
  points: 'Point Value',
  numAnagrams: 'Number of Anagrams',
  numVowels: 'Number of Vowels',
};

const SearchTypesOrder = [
  'length', 'probability', 'points', 'numAnagrams', 'numVowels', 'tags',
];

function searchCriteriaOptions() {
  return SearchTypesOrder.map(el => ({
    value: SearchTypes[el],
    displayValue: SearchTypesDisplay[el],
  }));
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
          value={this.props.strvalueList.join(', ')}
          onChange={() => {}}
        />
      </div>
    );
  }

  render() {
    let specificForm;
    switch (this.props.searchType) {
      case SearchTypes.probability:
      case SearchTypes.points:
      case SearchTypes.length:
      case SearchTypes.numVowels:
      case SearchTypes.numAnagrams:
        specificForm = this.renderMinMax(this.props.searchType);
        break;
      case SearchTypes.tags:
        specificForm = this.renderListValue(this.props.searchType);
        break;
      default:
        break;
    }
    return (
      <div className="row">
        <div className="col-lg-12">
          <button>+</button>
          <button>-</button>
          <Select
            colSize={4}
            label="Search Criterion"
            selectedValue={this.props.searchType}
            options={searchCriteriaOptions()}
          />
          {specificForm}
        </div>

      </div>
    );
  }
}

SearchRow.propTypes = {
  searchType: React.PropTypes.string,
  minValue: React.PropTypes.number,
  maxValue: React.PropTypes.number,
  strvalueList: React.PropTypes.arrayOf(React.PropTypes.string),
};

export default SearchRow;
export { SearchTypes };
