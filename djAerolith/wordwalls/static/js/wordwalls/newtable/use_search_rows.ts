import { useState, useCallback } from 'react';
import { searchCriterionToAdd, SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';

const maybeReorderCriteria = (searchCriteria: SearchCriterion[]): SearchCriterion[] => {
  // Matching anagram must always come last.
  const arrCopy: SearchCriterion[] = [];
  const toPushBack: SearchCriterion[] = [];
  searchCriteria.forEach((val) => {
    if (val.searchType === SearchTypesEnum.MATCHING_ANAGRAM
      || val.searchType === SearchTypesEnum.PROBABILITY_LIMIT) {
      toPushBack.push(val);
    } else {
      arrCopy.push(val);
    }
  });
  toPushBack.forEach((val) => arrCopy.push(val));
  return arrCopy;
};

interface UseSearchRowsReturn {
  searchCriteria: SearchCriterion[];
  addSearchRow: () => void;
  removeSearchRow: (criteriaIndex: number) => void;
  searchParamChange: (index: number, paramName: string, paramValue: string | number) => void;
  searchTypeChange: (index: number, value: string) => void;
}

export default function useSearchRows(
  allowedSearchTypes: Set<SearchTypesEnum>,
  initialSearchCriteria: SearchCriterion[],
): UseSearchRowsReturn {
  // Do a deep copy of initial criteria
  const [searchCriteria, setSearchCriteria] = useState<SearchCriterion[]>(
    () => initialSearchCriteria.map((sc) => sc.deepCopy()),
  );

  const addSearchRow = useCallback(() => {
    const toadd = searchCriterionToAdd(searchCriteria, allowedSearchTypes);
    if (!toadd) {
      return; // Don't add any more.
    }

    const newCriteria = searchCriteria.concat(toadd);
    setSearchCriteria(maybeReorderCriteria(newCriteria));
  }, [searchCriteria, allowedSearchTypes]);

  const removeSearchRow = useCallback((criteriaIndex: number) => {
    setSearchCriteria((currentCriteria) => {
      const criteria = [...currentCriteria];
      criteria.splice(criteriaIndex, 1);
      return criteria;
    });
  }, []);

  const searchParamChange = useCallback((
    index: number,
    paramName: string,
    paramValue: string | number,
  ) => {
    setSearchCriteria((currentCriteria) => {
      const criteria = [...currentCriteria];
      criteria[index].setOption(paramName, paramValue);
      return criteria;
    });
  }, []);

  const searchTypeChange = useCallback((index: number, value: string) => {
    const searchType = parseInt(value, 10);
    setSearchCriteria((currentCriteria) => {
      const criteria = [...currentCriteria];
      criteria[index].resetSearchType(searchType);
      return maybeReorderCriteria(criteria);
    });
  }, []);

  return {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  };
}
