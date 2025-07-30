import React from 'react';

import { SearchTypesEnum, SearchCriterion } from './types';
import SearchRow from './row';

interface SearchRowsProps {
  searches: SearchCriterion[];
  modifySearchType: (index: number, value: string) => void;
  modifySearchParam: (index: number, paramName: string, paramValue: string | number) => void;
  addSearchRow: () => void;
  removeSearchRow: (index: number) => void;
  allowedSearchTypes: Set<SearchTypesEnum>;
}

function SearchRows({
  searches,
  modifySearchType,
  modifySearchParam,
  addSearchRow,
  removeSearchRow,
  allowedSearchTypes,
}: SearchRowsProps) {
  return (
    <div>
      {searches.map((search, idx) => (
        <SearchRow
          key={`${search.searchType}-${search.options.minValue || search.options.value || 0}`}
          index={idx}
          searchType={search.searchType}
          searchCriterion={search.options}
          minAllowedValue={SearchTypesEnum.properties[search.searchType].minAllowed}
          maxAllowedValue={SearchTypesEnum.properties[search.searchType].maxAllowed}
          addRow={addSearchRow}
          removeRow={removeSearchRow}
          removeDisabled={idx === 0 && searches.length === 1}
          modifySearchType={modifySearchType}
          modifySearchParam={modifySearchParam}
          allowedSearchTypes={allowedSearchTypes}
        />
      ))}
    </div>
  );
}

export default SearchRows;
