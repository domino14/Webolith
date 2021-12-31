import React from 'react';
import PropTypes from 'prop-types';

import SearchRow from './row';
import { SearchTypesEnum, SearchCriterion } from './types';

function SearchRows(props) {
  return (
    <div>
      {props.searches.map((search, idx) => (
        <SearchRow
        // To suppress idx warning we use idx + 0, ew. XXX
          key={`row${idx + 0}`}
          index={idx}
          searchType={search.searchType}
          searchCriterion={search.options}
          minAllowedValue={SearchTypesEnum.properties[search.searchType].minAllowed}
          maxAllowedValue={SearchTypesEnum.properties[search.searchType].maxAllowed}
          addRow={props.addSearchRow}
          removeRow={props.removeSearchRow}
          removeDisabled={idx === 0 && props.searches.length === 1}
          modifySearchType={props.modifySearchType}
          modifySearchParam={props.modifySearchParam}
          allowedSearchTypes={props.allowedSearchTypes}
        />
      ))}
    </div>
  );
}

SearchRows.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  modifySearchType: PropTypes.func.isRequired,
  modifySearchParam: PropTypes.func.isRequired,
  addSearchRow: PropTypes.func.isRequired,
  removeSearchRow: PropTypes.func.isRequired,
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

export default SearchRows;
