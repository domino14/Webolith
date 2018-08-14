const SearchTypesEnum = {
  PROBABILITY: 1,
  LENGTH: 2,
  TAGS: 3,
  POINTS: 4,
  NUM_ANAGRAMS: 5,
  NUM_VOWELS: 6,
  FIXED_LENGTH: 7,
  NUM_TWO_BLANKS: 8,
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
      maxAllowed: 70000, // XXX should be subject to change by lexicon
    },
    2: {
      name: 'length',
      displayName: 'Word Length',
      defaultMin: 2,
      defaultMax: 15,
      minAllowed: 2,
      maxAllowed: 15,
    },
    3: {
      name: 'has_tags',
      displayName: 'Has Tags',
      valueList: '',
    },
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
    8: {
      name: 'number_2_blanks',
      displayName: 'Number of 2-blank questions',
      default: 4,
      minAllowed: 1,
      maxAllowed: 50,
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
  SearchTypesEnum.NUM_TWO_BLANKS,
];

function searchCriteriaOptions(allowedSearchTypes) {
  return SearchTypesOrder
    .filter(t => allowedSearchTypes.has(t))
    .map(el => ({
      value: String(el),
      displayValue: SearchTypesEnum.properties[el].displayName,
    }));
}

class SearchCriterion {
  constructor(searchType, options) {
    this.searchType = searchType;
    this.options = options;
  }
  /**
   * Convert this to an object that the backend would understand.
   */
  toJSObj() {
    return {
      searchType: SearchTypesEnum.properties[this.searchType].name,
      ...this.options,
    };
  }
  /**
   * Set the option to the passed-in value. This function takes care
   * of converting the optionValue to the proper type, based on the
   * optionName
   * @param {string} optionName The name of the option in the options dict
   * @param {any} optionValue The value for the option
   */
  setOption(optionName, optionValue) {
    const valueModifier = (val) => {
      if (['minValue', 'maxValue', 'value'].includes(optionName)) {
        return parseInt(val, 10) || 0;
      } else if (optionName === 'valueList') {
        return val.trim();
      }
      throw new Error('Unsupported option name');
    };

    this.options[optionName] = valueModifier(optionValue);
  }

  setOptions(options) {
    Object.keys(options).forEach(key => this.setOption(key, options[key]));
  }
}

/**
 * Given a list of word search criteria, figure out the next one to add,
 * based on the order.
 * @param {Array.<Object>} wordSearchCriteria
 * @param {Set} allowedSearchTypes
 * @return {SearchCriterion?} A new search type criterion, or null.
 */
function searchCriterionToAdd(wordSearchCriteria, allowedSearchTypes) {
  const stmap = {};
  wordSearchCriteria.forEach((criteria) => {
    // These are enum integers.
    stmap[criteria.searchType] = true;
  });
  // Find the first search type that's not in the map.
  const newtypeId = SearchTypesOrder
    .filter(t => allowedSearchTypes.has(t))
    .find(tid => stmap[tid] == null);

  if (!newtypeId) {
    return null;
  }
  if (newtypeId === SearchTypesEnum.TAGS) {
    return new SearchCriterion(newtypeId, {
      valueList: '',
    });
  }
  if (newtypeId === SearchTypesEnum.FIXED_LENGTH ||
      newtypeId === SearchTypesEnum.NUM_TWO_BLANKS) {
    return new SearchCriterion(newtypeId, {
      value: SearchTypesEnum.properties[newtypeId].default,
    });
  }
  return new SearchCriterion(newtypeId, {
    minValue: SearchTypesEnum.properties[newtypeId].defaultMin,
    maxValue: SearchTypesEnum.properties[newtypeId].defaultMax,
  });
}

export {
  SearchTypesEnum,
  searchCriterionToAdd,
  searchCriteriaOptions,
  SearchCriterion,
};
