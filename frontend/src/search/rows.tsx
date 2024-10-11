import React from "react";
import { SearchTypesEnum, SearchCriterion, optionType } from "./types";
import SearchRow from "./row";

interface SearchRowsProps {
  criteria: SearchCriterion[];
  modifySearchType: (index: number, value: number) => void;
  modifySearchParam: (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => void;
  addSearchRow: () => void;
  removeSearchRow: (index: number) => void;
  allowedSearchTypes: Set<number>;
}

const SearchRows: React.FC<SearchRowsProps> = (props) => {
  return (
    <div>
      {props.criteria.map((criterion, idx) => (
        <SearchRow
          key={`row${idx}`}
          index={idx}
          searchCriterion={criterion}
          minAllowedValue={
            SearchTypesEnum.properties[criterion.searchType].minAllowed
          }
          maxAllowedValue={
            SearchTypesEnum.properties[criterion.searchType].maxAllowed
          }
          addRow={props.addSearchRow}
          removeRow={props.removeSearchRow}
          removeDisabled={idx === 0 && props.criteria.length === 1}
          modifySearchType={props.modifySearchType}
          modifySearchParam={props.modifySearchParam}
          allowedSearchTypes={props.allowedSearchTypes}
        />
      ))}
    </div>
  );
};

export default SearchRows;