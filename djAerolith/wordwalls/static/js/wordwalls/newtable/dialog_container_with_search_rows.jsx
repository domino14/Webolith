/**
 * A generic Dialog container for the different modes. This uses a Higher-Order
 * container in order to avoid repeating the search row add / remove / state
 * management code.
 */
import React from 'react';

import { SearchTypesEnum, searchCriterionToAdd } from './search/types';

function withSearchRows(WrappedDialogContainer, allowedSearchTypes, searchCriteria) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.searchParamChange = this.searchParamChange.bind(this);
      this.searchTypeChange = this.searchTypeChange.bind(this);
      this.addSearchRow = this.addSearchRow.bind(this);
      this.removeSearchRow = this.removeSearchRow.bind(this);

      const scCopy = searchCriteria.map(sc => sc.deepCopy());
      this.state = {
        // Do a deep copy.
        searchCriteria: scCopy,
      };
      this.allowedSearchTypes = allowedSearchTypes;
    }

    addSearchRow() {
      const toadd = searchCriterionToAdd(this.state.searchCriteria, this.allowedSearchTypes);
      if (!toadd) {
        return; // Don't add any more.
      }

      const newCriteria = this.state.searchCriteria.concat(toadd);
      this.setState({
        searchCriteria: newCriteria,
      });
    }

    removeSearchRow(criteriaIndex) {
      const currentCriteria = this.state.searchCriteria;
      currentCriteria.splice(criteriaIndex, 1);
      this.setState({
        searchCriteria: currentCriteria,
      });
    }

    searchParamChange(index, paramName, paramValue) {
      const criteria = this.state.searchCriteria;
      criteria[index].setOption(paramName, paramValue);
      this.setState({
        searchCriteria: criteria,
      });
    }

    searchTypeChange(index, value) {
      const criteria = this.state.searchCriteria;
      const searchType = parseInt(value, 10);

      criteria[index].searchType = searchType;
      // Reset the values.
      if ([SearchTypesEnum.LENGTH, SearchTypesEnum.NUM_ANAGRAMS, SearchTypesEnum.NUM_VOWELS,
        SearchTypesEnum.POINTS, SearchTypesEnum.PROBABILITY].includes(searchType)) {
        // Defaults to two options for this criteria - min/max
        criteria[index].setOptions({
          minValue: SearchTypesEnum.properties[searchType].defaultMin,
          maxValue: SearchTypesEnum.properties[searchType].defaultMax,
        });
      } else if (searchType === SearchTypesEnum.FIXED_LENGTH) {
        criteria[index].setOptions({
          value: SearchTypesEnum.properties[searchType].default,
        });
      } else if (searchType === SearchTypesEnum.TAGS) {
        criteria[index].setOptions({
          valueList: '',
        });
      }
      this.setState({
        searchCriteria: criteria,
      });
    }

    render() {
      return (
        <WrappedDialogContainer
          searches={this.state.searchCriteria}
          addSearchRow={this.addSearchRow}
          removeSearchRow={this.removeSearchRow}
          onSearchTypeChange={this.searchTypeChange}
          onSearchParamChange={this.searchParamChange}
          {...this.props}
        />
      );
    }
  };
}

export default withSearchRows;

