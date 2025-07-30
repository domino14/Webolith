import * as React from "react";
import {
  optionType,
  SearchCriterion,
  searchCriterionToAdd,
  SearchTypesEnum,
} from "./types";

const maybeReorderCriteria = (searchCriteria: SearchCriterion[]) => {
  // Matching anagram must always come last.
  const arrCopy: SearchCriterion[] = [];
  const toPushBack: SearchCriterion[] = [];
  searchCriteria.forEach((val) => {
    if (
      val.searchType === SearchTypesEnum.MATCHING_ANAGRAM ||
      val.searchType === SearchTypesEnum.PROBABILITY_LIMIT
    ) {
      toPushBack.push(val);
    } else {
      arrCopy.push(val);
    }
  });
  return [...arrCopy, ...toPushBack];
};

function useSearchRows(
  initialCriteria: SearchCriterion[],
  allowedSearchTypes: Set<number>
) {
  const [searchCriteria, setSearchCriteria] = React.useState(
    initialCriteria.map((sc) => sc.deepCopy())
  );

  const addSearchRow = () => {
    const toAdd = searchCriterionToAdd(searchCriteria, allowedSearchTypes);
    if (!toAdd) {
      return; // Don't add any more.
    }
    const newCriteria = maybeReorderCriteria([...searchCriteria, toAdd]);
    setSearchCriteria(newCriteria);
  };

  const removeSearchRow = (criteriaIndex: number) => {
    const newCriteria = searchCriteria.filter(
      (_, index) => index !== criteriaIndex
    );
    setSearchCriteria(newCriteria);
  };

  const searchParamChange = (
    index: number,
    paramName: string,
    paramValue: optionType
  ) => {
    const updatedCriteria = searchCriteria.map((criterion, idx) => {
      if (idx === index) {
        criterion.setOption(paramName, paramValue);
      }
      return criterion;
    });
    setSearchCriteria(updatedCriteria);
  };

  const searchTypeChange = (index: number, value: optionType) => {
    const updatedCriteria = searchCriteria.map((criterion, idx) => {
      if (idx === index) {
        const searchType = parseInt(value as string, 10);
        criterion.resetSearchType(searchType);
      }
      return criterion;
    });
    setSearchCriteria(maybeReorderCriteria(updatedCriteria));
  };

  return {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  };
}

export default useSearchRows;
