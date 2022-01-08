import searcher from '../../gen/rpc/wordsearcher/searcher_pb';

const pbsrConditions = searcher.SearchRequest.Condition;

const SearchTypesInputs = {
  TWO_NUMBERS: 1,
  ONE_NUMBER: 2,
  ONE_STRING: 3,
  SELECT: 4,
  NONE: 5,
};

const SearchTypesEnum = {
  PROBABILITY: pbsrConditions.PROBABILITY_RANGE,
  LENGTH: pbsrConditions.LENGTH,
  TAGS: pbsrConditions.HAS_TAGS,
  POINTS: pbsrConditions.POINT_VALUE,
  NUM_ANAGRAMS: pbsrConditions.NUMBER_OF_ANAGRAMS,
  NUM_VOWELS: pbsrConditions.NUMBER_OF_VOWELS,
  FIXED_LENGTH: pbsrConditions.SINGLE_VALUE_LENGTH,
  NUM_TWO_BLANKS: pbsrConditions.NUM_TWO_BLANKS,
  MAX_SOLUTIONS: pbsrConditions.MAX_SOLUTIONS,
  NOT_IN_LEXICON: pbsrConditions.NOT_IN_LEXICON,
  PROBABILITY_LIMIT: pbsrConditions.PROBABILITY_LIMIT,
  MATCHING_ANAGRAM: pbsrConditions.MATCHING_ANAGRAM,
  DIFFICULTY_RANGE: pbsrConditions.DIFFICULTY_RANGE,
  DELETED_WORDS: pbsrConditions.DELETED_WORDS,
  /**
   * The inputs won't allow user to go beyond minAllowed and maxAllowed.
   * defaultMin and defaultMax are the values that show up when the
   * input is first placed on the screen.
   */
  properties: {
    [pbsrConditions.PROBABILITY_RANGE]: {
      code: pbsrConditions.PROBABILITY_RANGE,
      displayName: 'Probability Range',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 1,
      defaultMax: 100,
      minAllowed: 1,
      maxAllowed: 70000, // XXX should be subject to change by lexicon
      description: `Probability range lets you pick the top alphagrams by
      raw probability of drawing these tiles. Note: probability assumes
      there are two blanks in the bag, and alphagrams with identical
      probabilities will still have different (but consecutive) numbers.`,
    },
    [pbsrConditions.LENGTH]: {
      code: pbsrConditions.LENGTH,
      displayName: 'Word Length',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 2,
      defaultMax: 15,
      minAllowed: 2,
      maxAllowed: 15,
      description: 'You can filter by length of word with this option.',
    },
    [pbsrConditions.HAS_TAGS]: {
      code: pbsrConditions.HAS_TAGS,
      displayName: 'Has Tags',
      default: '',
      inputType: SearchTypesInputs.ONE_STRING,
      description: 'This is an unreleased feature, hold tight :)',
    },
    [pbsrConditions.POINT_VALUE]: {
      code: pbsrConditions.POINT_VALUE,
      displayName: 'Point Value',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 2,
      defaultMax: 30,
      minAllowed: 2,
      maxAllowed: 150, // for ZZZZZZZZZZZZZZZ
      description: `Filter by point value of the word. Letter values are taken
      from a certain crossword game HINT HINT.`,
    },
    [pbsrConditions.NUMBER_OF_ANAGRAMS]: {
      code: pbsrConditions.NUMBER_OF_ANAGRAMS,
      displayName: 'Number of Anagrams',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 1,
      defaultMax: 15,
      minAllowed: 1,
      maxAllowed: 99,
      description: `The number of total anagrams of this word, including
      the word itself.`,
    },
    [pbsrConditions.NUMBER_OF_VOWELS]: {
      code: pbsrConditions.NUMBER_OF_VOWELS,
      displayName: 'Number of Vowels',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 0,
      defaultMax: 15,
      minAllowed: 0,
      maxAllowed: 15,
      description: 'The number of vowels in this word',
    },
    [pbsrConditions.SINGLE_VALUE_LENGTH]: {
      code: pbsrConditions.SINGLE_VALUE_LENGTH,
      displayName: 'Word Length',
      inputType: SearchTypesInputs.ONE_NUMBER,
      default: 5,
      minAllowed: 5,
      maxAllowed: 10,
      description: 'You can filter by length of word with this option.',
    },
    [pbsrConditions.NUM_TWO_BLANKS]: {
      code: pbsrConditions.NUM_TWO_BLANKS,
      displayName: 'Number of 2-blank questions',
      inputType: SearchTypesInputs.ONE_NUMBER,
      default: 4,
      minAllowed: 1,
      maxAllowed: 50,
      description: 'How many questions with 2-blanks to generate in total.',
    },
    [pbsrConditions.MAX_SOLUTIONS]: {
      code: pbsrConditions.MAX_SOLUTIONS,
      displayName: 'Maximum number of anagrams',
      inputType: SearchTypesInputs.ONE_NUMBER,
      default: 5,
      minAllowed: 1,
      maxAllowed: 200,
      description: `The maximum number of anagrams that a question can have.
      No questions will be generated that have more than this number of anagrams.`,
    },
    [pbsrConditions.NOT_IN_LEXICON]: {
      code: pbsrConditions.NOT_IN_LEXICON,
      displayName: 'Not in lexicon',
      inputType: SearchTypesInputs.SELECT,
      default: 'other_english',
      options: [
        ['other_english', 'Other English-language lexicon'],
        ['update', 'Last version of this lexicon'],
      ],
      description: `Only looks for words that are NOT in the selected lexicon.
      The "other English-language lexicon" refers to CSW19 if you are currently
      using the NWL20 lexicon, and NWL20 if you are currently using the
      CSW19 lexicon. The "last version" is only CSW15 if you are using the CSW19
      lexicon. NWL20 has no new words compared to NWL18.`,
    },
    [pbsrConditions.PROBABILITY_LIMIT]: {
      code: pbsrConditions.PROBABILITY_LIMIT,
      displayName: 'Probability limit',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 1,
      defaultMax: 100,
      minAllowed: 1,
      maxAllowed: 70000,
      description: `Probability limit is similar to probability range, but
      it is applied after all other searches. For example, you can select the
      top 100 8-letter words with 5 vowels, and you will get 100 questions. If
      you used the "Probability range" option, though, you would only get any
      questions that were already in the 1-100 range by intrinsic probability,
      prior to applying any filters.`,
    },
    [pbsrConditions.MATCHING_ANAGRAM]: {
      code: pbsrConditions.MATCHING_ANAGRAM,
      displayName: 'Anagram match',
      inputType: SearchTypesInputs.ONE_STRING,
      default: 'AEINST??',
      description: `Provide an initial list of words to search with an anagram
      search. You can use up to 8 blank characters (use a ? character to
      represent a blank).`,
    },
    [pbsrConditions.DIFFICULTY_RANGE]: {
      code: pbsrConditions.DIFFICULTY_RANGE,
      displayName: 'Difficulty range',
      inputType: SearchTypesInputs.TWO_NUMBERS,
      defaultMin: 1,
      defaultMax: 100,
      minAllowed: 1,
      maxAllowed: 100,
      description: `Difficulty range is only applicable to 7 and 8 letter words
      in NWL20 and CSW19 currently. These words were
      split into 100 equal-size groups by difficulty, ranging from 1 (easiest)
      to 100 (hardest).`,
    },
    [pbsrConditions.DELETED_WORDS]: {
      code: pbsrConditions.DELETED_WORDS,
      displayName: 'Words deleted from previous lexicon',
      inputType: SearchTypesInputs.NONE,
      description: `You can search for words that are not in this lexicon but were
      in the previous version of this lexicon. At the moment, this only works with English lexica.
      The only filter you can use with this search is the word length filter.`,
    },
  },
};

const SearchTypesOrder = [
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.MATCHING_ANAGRAM,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.NOT_IN_LEXICON,
  SearchTypesEnum.FIXED_LENGTH,
  SearchTypesEnum.DIFFICULTY_RANGE,
  SearchTypesEnum.TAGS,
  SearchTypesEnum.NUM_TWO_BLANKS,
  SearchTypesEnum.MAX_SOLUTIONS,
  SearchTypesEnum.PROBABILITY_LIMIT,
  SearchTypesEnum.DELETED_WORDS,
];

function searchCriteriaOptions(allowedSearchTypes) {
  return SearchTypesOrder
    .filter((t) => allowedSearchTypes.has(t))
    .map((el) => ({
      value: String(el),
      displayValue: SearchTypesEnum.properties[el].displayName,
    }));
}

class SearchCriterion {
  constructor(searchType, options) {
    this.searchType = searchType;
    this.options = options;
  }

  inputType() {
    return SearchTypesEnum.properties[this.searchType].inputType;
  }

  deepCopy() {
    return new SearchCriterion(this.searchType, {
      ...this.options,
    });
  }

  /**
   * Convert this to an object that the backend would understand.
   */
  toJSObj() {
    const obj = {
      searchType: SearchTypesEnum.properties[this.searchType].code,
      ...this.options,
    };
    return obj;
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
      switch (this.inputType()) {
        case SearchTypesInputs.ONE_NUMBER:
        case SearchTypesInputs.TWO_NUMBERS:
          return parseInt(val, 10) || 0;
        case SearchTypesInputs.ONE_STRING:
          return val.trim();
        case SearchTypesInputs.SELECT:
          return val;
        case SearchTypesInputs.NONE:
          return '';
        default:
          throw new Error('Unsupported option name');
      }
    };
    this.options[optionName] = valueModifier(optionValue);
  }

  setOptions(options) {
    Object.keys(options).forEach((key) => this.setOption(key, options[key]));
  }

  resetSearchType(searchType) {
    this.searchType = searchType;
    // Reset the values.
    switch (SearchTypesEnum.properties[searchType].inputType) {
      case SearchTypesInputs.TWO_NUMBERS:
        this.setOptions({
          minValue: SearchTypesEnum.properties[searchType].defaultMin,
          maxValue: SearchTypesEnum.properties[searchType].defaultMax,
        });
        break;
      case SearchTypesInputs.ONE_NUMBER:
      case SearchTypesInputs.ONE_STRING:
      case SearchTypesInputs.SELECT:
        this.setOptions({
          value: SearchTypesEnum.properties[searchType].default,
        });
        break;
      default:
        break;
    }
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
    .filter((t) => allowedSearchTypes.has(t))
    .find((tid) => stmap[tid] == null);

  if (!newtypeId) {
    return null;
  }

  const typeProps = SearchTypesEnum.properties[newtypeId];
  switch (typeProps.inputType) {
    case SearchTypesInputs.ONE_STRING:
    case SearchTypesInputs.ONE_NUMBER:
    case SearchTypesInputs.SELECT:
      return new SearchCriterion(newtypeId, {
        value: SearchTypesEnum.properties[newtypeId].default,
      });
    case SearchTypesInputs.TWO_NUMBERS:
      return new SearchCriterion(newtypeId, {
        minValue: SearchTypesEnum.properties[newtypeId].defaultMin,
        maxValue: SearchTypesEnum.properties[newtypeId].defaultMax,
      });
    case SearchTypesInputs.NONE:
      return new SearchCriterion(newtypeId, {});
    default:
      break;
  }
  return null;
}

export {
  SearchTypesEnum,
  SearchTypesOrder,
  searchCriterionToAdd,
  searchCriteriaOptions,
  SearchCriterion,
  SearchTypesInputs,
};
