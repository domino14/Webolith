import {
  SearchRequest_Condition,
  SearchRequest_MinMax,
  SearchRequest_NotInLexCondition,
  SearchRequest_NumberValue,
  SearchRequest_SearchParam,
  SearchRequest_StringValue,
  SearchRequest_HooksParam,
  SearchRequest_HookType,
} from "../gen/rpc/wordsearcher/searcher_pb";

const cond = SearchRequest_Condition;
export type optionType = number | string | boolean | undefined;

enum SearchTypesInputs {
  TWO_NUMBERS = 1,
  ONE_NUMBER = 2,
  ONE_STRING = 3,
  SELECT = 4,
  NONE = 5,
  HOOKS = 6,
}

interface SearchTypeProperty {
  code: number;
  displayName: string;
  inputType: SearchTypesInputs;
  defaultMin?: number;
  defaultMax?: number;
  default?: number | string;
  minAllowed?: number;
  maxAllowed?: number;
  options?: [string, string][];
  description: string;
}

const propertiesObject: { [key: number]: SearchTypeProperty } = {
  [cond.PROBABILITY_RANGE]: {
    code: cond.PROBABILITY_RANGE,
    displayName: "Probability Range",
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
  [cond.LENGTH]: {
    code: cond.LENGTH,
    displayName: "Word Length",
    inputType: SearchTypesInputs.TWO_NUMBERS,
    defaultMin: 2,
    defaultMax: 15,
    minAllowed: 2,
    maxAllowed: 15,
    description: "You can filter by length of word with this option.",
  },
  [cond.HAS_TAGS]: {
    code: cond.HAS_TAGS,
    displayName: "Has Tags",
    default: "",
    inputType: SearchTypesInputs.ONE_STRING,
    description: "This is an unreleased feature, hold tight :)",
  },
  [cond.POINT_VALUE]: {
    code: cond.POINT_VALUE,
    displayName: "Point Value",
    inputType: SearchTypesInputs.TWO_NUMBERS,
    defaultMin: 2,
    defaultMax: 30,
    minAllowed: 2,
    maxAllowed: 150, // for ZZZZZZZZZZZZZZZ
    description: `Filter by point value of the word. Letter values are taken
    from a certain crossword game HINT HINT.`,
  },
  [cond.NUMBER_OF_ANAGRAMS]: {
    code: cond.NUMBER_OF_ANAGRAMS,
    displayName: "Number of Anagrams",
    inputType: SearchTypesInputs.TWO_NUMBERS,
    defaultMin: 1,
    defaultMax: 15,
    minAllowed: 1,
    maxAllowed: 99,
    description: `The number of total anagrams of this word, including
    the word itself.`,
  },
  [cond.NUMBER_OF_VOWELS]: {
    code: cond.NUMBER_OF_VOWELS,
    displayName: "Number of Vowels",
    inputType: SearchTypesInputs.TWO_NUMBERS,
    defaultMin: 0,
    defaultMax: 15,
    minAllowed: 0,
    maxAllowed: 15,
    description: "The number of vowels in this word",
  },
  [cond.SINGLE_VALUE_LENGTH]: {
    code: cond.SINGLE_VALUE_LENGTH,
    displayName: "Word Length",
    inputType: SearchTypesInputs.ONE_NUMBER,
    default: 5,
    minAllowed: 5,
    maxAllowed: 10,
    description: "You can filter by length of word with this option.",
  },
  [cond.NUM_TWO_BLANKS]: {
    code: cond.NUM_TWO_BLANKS,
    displayName: "Number of 2-blank questions",
    inputType: SearchTypesInputs.ONE_NUMBER,
    default: 4,
    minAllowed: 1,
    maxAllowed: 50,
    description: "How many questions with 2-blanks to generate in total.",
  },
  [cond.MAX_SOLUTIONS]: {
    code: cond.MAX_SOLUTIONS,
    displayName: "Maximum number of anagrams",
    inputType: SearchTypesInputs.ONE_NUMBER,
    default: 5,
    minAllowed: 1,
    maxAllowed: 200,
    description: `The maximum number of anagrams that a question can have.
    No questions will be generated that have more than this number of anagrams.`,
  },
  [cond.NOT_IN_LEXICON]: {
    code: cond.NOT_IN_LEXICON,
    displayName: "Not in lexicon",
    inputType: SearchTypesInputs.SELECT,
    default: "update",
    options: [
      ["update", "Last version of this lexicon"],
      ["other_english", "Other English-language lexicon"],
    ],
    description: `Only looks for words that are NOT in the selected lexicon.
    The "other English-language lexicon" refers to CSW24 if you are currently
    using the NWL23 lexicon, and NWL23 if you are currently using the
    CSW24 lexicon.`,
  },
  [cond.PROBABILITY_LIMIT]: {
    code: cond.PROBABILITY_LIMIT,
    displayName: "Probability limit",
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
  [cond.MATCHING_ANAGRAM]: {
    code: cond.MATCHING_ANAGRAM,
    displayName: "Anagram match",
    inputType: SearchTypesInputs.ONE_STRING,
    default: "AEINST??",
    description: `Provide an initial list of words to search with an anagram
    search. You can use up to 8 blank characters (use a ? character to
    represent a blank). If you wish to provide a range of letters, use the ()
    symbols. For example, you can search for all JQXZ 4s with the following
    search: (JQXZ)???`,
  },
  [cond.DIFFICULTY_RANGE]: {
    code: cond.DIFFICULTY_RANGE,
    displayName: "Difficulty range",
    inputType: SearchTypesInputs.TWO_NUMBERS,
    defaultMin: 1,
    defaultMax: 100,
    minAllowed: 1,
    maxAllowed: 100,
    description: `Difficulty range is only applicable to 7 and 8 letter words
    in NWL23 and CSW24 currently. These words were split into 100 equal-size groups
    by difficulty, ranging from 1 (easiest) to 100 (hardest).`,
  },
  [cond.DELETED_WORD]: {
    code: cond.DELETED_WORD,
    displayName: "Words deleted from previous lexicon",
    inputType: SearchTypesInputs.NONE,
    description: `You can search for words that are not in this lexicon but were
    in the previous version of this lexicon. At the moment, this only works with English lexica.
    The only filter you can use with this search is the word length filter.`,
  },
  [cond.CONTAINS_HOOKS]: {
    code: cond.CONTAINS_HOOKS,
    displayName: "Contains Hooks",
    inputType: SearchTypesInputs.HOOKS,
    description: `Search for words containing specific hooks. Select hook type,
    enter the letters, and optionally check NOT to exclude matches.`,
  },
  [cond.DEFINITION_CONTAINS]: {
    code: cond.DEFINITION_CONTAINS,
    displayName: "Definition Contains",
    inputType: SearchTypesInputs.ONE_STRING,
    default: "",
    description: `Search for words whose definitions contain specific text.
    Enter the text you want to search for in the definitions.`,
  },
};

const SearchTypesEnum = {
  PROBABILITY: cond.PROBABILITY_RANGE,
  LENGTH: cond.LENGTH,
  TAGS: cond.HAS_TAGS,
  POINTS: cond.POINT_VALUE,
  NUM_ANAGRAMS: cond.NUMBER_OF_ANAGRAMS,
  NUM_VOWELS: cond.NUMBER_OF_VOWELS,
  FIXED_LENGTH: cond.SINGLE_VALUE_LENGTH,
  NUM_TWO_BLANKS: cond.NUM_TWO_BLANKS,
  MAX_SOLUTIONS: cond.MAX_SOLUTIONS,
  NOT_IN_LEXICON: cond.NOT_IN_LEXICON,
  PROBABILITY_LIMIT: cond.PROBABILITY_LIMIT,
  MATCHING_ANAGRAM: cond.MATCHING_ANAGRAM,
  DIFFICULTY_RANGE: cond.DIFFICULTY_RANGE,
  DELETED_WORD: cond.DELETED_WORD,
  CONTAINS_HOOKS: cond.CONTAINS_HOOKS,
  DEFINITION_CONTAINS: cond.DEFINITION_CONTAINS,
  properties: propertiesObject,
};

const SearchTypesOrder: number[] = [
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
  SearchTypesEnum.DELETED_WORD,
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
];

function searchCriteriaOptions(
  allowedSearchTypes: Set<number>
): { value: string; displayValue: string }[] {
  return SearchTypesOrder.filter((t) => allowedSearchTypes.has(t)).map(
    (el) => ({
      value: String(el),
      displayValue: SearchTypesEnum.properties[el].displayName,
    })
  );
}

export const lexiconSearchCriterion = (lex: string) => {
  return new SearchRequest_SearchParam({
    condition: SearchRequest_Condition.LEXICON,
    conditionparam: {
      case: "stringvalue",
      value: new SearchRequest_StringValue({
        value: lex,
      }),
    },
  });
};

class SearchCriterion {
  searchType: number;
  options: { [key: string]: optionType };

  constructor(searchType: number, options: { [key: string]: optionType }) {
    this.searchType = searchType;
    this.options = options;
  }

  inputType(): SearchTypesInputs {
    return SearchTypesEnum.properties[this.searchType].inputType;
  }

  deepCopy(): SearchCriterion {
    return new SearchCriterion(this.searchType, { ...this.options });
  }

  /**
   * Convert this to an object that the backend would understand.
   */
  toJSObj(): { [key: string]: optionType } {
    return {
      searchType: SearchTypesEnum.properties[this.searchType].code,
      ...this.options,
    };
  }

  toProtoObj(): SearchRequest_SearchParam {
    const obj = new SearchRequest_SearchParam({
      condition: SearchTypesEnum.properties[this.searchType].code,
    });

    switch (this.inputType()) {
      case SearchTypesInputs.ONE_NUMBER:
        obj.conditionparam = {
          case: "numbervalue",
          value: new SearchRequest_NumberValue({
            value: this.options.value as number,
          }),
        };
        break;
      case SearchTypesInputs.TWO_NUMBERS:
        obj.conditionparam = {
          case: "minmax",
          value: new SearchRequest_MinMax({
            min: this.options.minValue as number,
            max: this.options.maxValue as number,
          }),
        };
        break;
      case SearchTypesInputs.ONE_STRING:
        obj.conditionparam = {
          case: "stringvalue",
          value: new SearchRequest_StringValue({
            value: this.options.value as string,
          }),
        };
        break;
      case SearchTypesInputs.SELECT:
        // This is a special case; only used for NOT_IN_LEXICON,
        // which is a number!
        obj.conditionparam = {
          case: "numbervalue",
          value: new SearchRequest_NumberValue({
            value:
              this.options.value === "update"
                ? SearchRequest_NotInLexCondition.PREVIOUS_VERSION
                : this.options.value === "other_english"
                ? SearchRequest_NotInLexCondition.OTHER_ENGLISH
                : -1, // ?
          }),
        };
        break;
      case SearchTypesInputs.HOOKS:
        obj.conditionparam = {
          case: "hooksparam",
          value: new SearchRequest_HooksParam({
            hookType: this.options.hookType as number,
            hooks: this.options.hooks as string,
            notCondition: this.options.notCondition as boolean,
          }),
        };
        break;
      default:
        throw new Error("unhandled search type");
    }
    return obj;
  }

  /**
   * Set the option to the passed-in value. This function takes care
   * of converting the optionValue to the proper type, based on the
   * optionName
   */
  setOption(optionName: string, optionValue: optionType): void {
    const valueModifier = (val: optionType): optionType => {
      switch (this.inputType()) {
        case SearchTypesInputs.ONE_NUMBER:
        case SearchTypesInputs.TWO_NUMBERS:
          return parseInt(val as string, 10) || 0;
        case SearchTypesInputs.ONE_STRING:
          return (val as string).trim();
        case SearchTypesInputs.SELECT:
          return val;
        case SearchTypesInputs.NONE:
          return "";
        case SearchTypesInputs.HOOKS:
          if (optionName === "hookType") {
            return parseInt(val as string, 10) || 0;
          } else if (optionName === "hooks") {
            return (val as string).trim();
          } else if (optionName === "notCondition") {
            return Boolean(val);
          }
          return val;
        default:
          throw new Error("Unsupported option name");
      }
    };
    this.options[optionName] = valueModifier(optionValue);
  }

  setOptions(options: { [key: string]: optionType }): void {
    Object.keys(options).forEach((key) => this.setOption(key, options[key]));
  }

  resetSearchType(searchType: number): void {
    this.searchType = searchType;
    // Reset the values.
    const typeProps = SearchTypesEnum.properties[searchType];
    switch (typeProps.inputType) {
      case SearchTypesInputs.TWO_NUMBERS:
        this.setOptions({
          minValue: typeProps.defaultMin,
          maxValue: typeProps.defaultMax,
        });
        break;
      case SearchTypesInputs.ONE_NUMBER:
      case SearchTypesInputs.ONE_STRING:
      case SearchTypesInputs.SELECT:
        this.setOptions({
          value: typeProps.default,
        });
        break;
      case SearchTypesInputs.HOOKS:
        this.setOptions({
          hookType: SearchRequest_HookType.FRONT_HOOKS,
          hooks: "",
          notCondition: false,
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
 * @param wordSearchCriteria
 * @param allowedSearchTypes
 * @return A new search type criterion, or null.
 */
function searchCriterionToAdd(
  wordSearchCriteria: SearchCriterion[],
  allowedSearchTypes: Set<number>
): SearchCriterion | null {
  const stmap: { [key: number]: boolean } = {};
  wordSearchCriteria.forEach((criteria) => {
    // These are enum integers.
    stmap[criteria.searchType] = true;
  });
  // Find the first search type that's not in the map.
  const newtypeId = SearchTypesOrder.filter((t) =>
    allowedSearchTypes.has(t)
  ).find((tid) => !stmap[tid]);

  if (newtypeId == null) {
    return null;
  }

  const typeProps = SearchTypesEnum.properties[newtypeId];
  switch (typeProps.inputType) {
    case SearchTypesInputs.ONE_STRING:
    case SearchTypesInputs.ONE_NUMBER:
    case SearchTypesInputs.SELECT:
      return new SearchCriterion(newtypeId, {
        value: typeProps.default,
      });
    case SearchTypesInputs.TWO_NUMBERS:
      return new SearchCriterion(newtypeId, {
        minValue: typeProps.defaultMin,
        maxValue: typeProps.defaultMax,
      });
    case SearchTypesInputs.NONE:
      return new SearchCriterion(newtypeId, {});
    case SearchTypesInputs.HOOKS:
      return new SearchCriterion(newtypeId, {
        hookType: SearchRequest_HookType.FRONT_HOOKS,
        hooks: "",
        notCondition: false,
      });
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
