const SearchTypesEnum = {
  PROBABILITY: 1,
  LENGTH: 2,
  TAGS: 3,
  POINTS: 4,
  NUM_ANAGRAMS: 5,
  NUM_VOWELS: 6,
  FIXED_LENGTH: 7,
  /**
   * The inputs won't allow user to go beyond minAllowed and maxAllowed.
   * defaultMin and defaultMax are the values that show up when the
   * input is first placed on the screen.
   */
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
      defaultMax: 30,
      minAllowed: 2,
      maxAllowed: 150, // for ZZZZZZZZZZZZZZZ
    },
    5: {
      name: 'number_anagrams',
      displayName: 'Number of Anagrams',
      defaultMin: 1,
      defaultMax: 15,
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
    7: {
      name: 'fixed_length',
      displayName: 'Word Length',
      default: 5,
      minAllowed: 5,
      maxAllowed: 10,
    },
  },
};

const SearchTypesOrder = [
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.FIXED_LENGTH,
  SearchTypesEnum.TAGS,
];

function searchCriteriaOptions(allowedSearchTypes) {
  return SearchTypesOrder
    .filter(t => allowedSearchTypes.has(t))
    .map(el => ({
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
      //criterion: {
        valueList: '',
      //},
    };
  }
  if (newtypeId === SearchTypesEnum.FIXED_LENGTH) {
    return {
      searchType: newtypeId,
      //criterion: {
        value: SearchTypesEnum.properties[newtypeId].default,
      //},
    };
  }
  return {
    searchType: newtypeId,
    //criterion: {
      minValue: SearchTypesEnum.properties[newtypeId].defaultMin,
      maxValue: SearchTypesEnum.properties[newtypeId].defaultMax,
    //},
  };
}

export { SearchTypesEnum, searchCriterionToAdd, searchCriteriaOptions };
