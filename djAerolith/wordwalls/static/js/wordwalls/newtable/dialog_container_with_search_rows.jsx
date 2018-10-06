/**
 * A generic Dialog container for the different modes. This uses a Higher-Order
 * container in order to avoid repeating the search row add / remove / state
 * management code.
 */
import React from 'react';

import { searchCriterionToAdd, SearchTypesEnum } from './search/types';

const maybeReorderCriteria = (searchCriteria) => {
  // Matching anagram must always come last.
  const arrCopy = [];
  const toPushBack = [];
  searchCriteria.forEach((val) => {
    if (val.searchType === SearchTypesEnum.MATCHING_ANAGRAM ||
        val.searchType === SearchTypesEnum.PROBABILITY_LIMIT) {
      toPushBack.push(val);
    } else {
      arrCopy.push(val);
    }
  });
  toPushBack.forEach(val => arrCopy.push(val));
  return arrCopy;
};

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
        searchCriteria: maybeReorderCriteria(newCriteria),
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
      criteria[index].resetSearchType(searchType);
      this.setState({
        searchCriteria: maybeReorderCriteria(criteria),
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

