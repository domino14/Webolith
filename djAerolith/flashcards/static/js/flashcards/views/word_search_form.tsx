import React, { useState } from "react";
import { SearchTypesEnum, SearchCriterion } from "wordvaultapp/search/types";
import SearchRows from "wordwallsapp/newtable/search/rows";
import Select from "wordwallsapp/forms/select";
import useSearchRows from "wordvaultapp/search/use_search_rows";

const allowedSearchTypes = new Set<number>([
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.TAGS,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.NOT_IN_LEXICON,
  SearchTypesEnum.DIFFICULTY_RANGE,
  SearchTypesEnum.PROBABILITY_LIMIT,
  SearchTypesEnum.MATCHING_ANAGRAM,
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
]);

const lexOptions = [
  { value: "NWL23", displayValue: "NWL23" },
  { value: "CSW24", displayValue: "CSW24" },
];

const initialCriteria = [
  new SearchCriterion(SearchTypesEnum.LENGTH, {
    minValue: 7,
    maxValue: 7,
  }),
  new SearchCriterion(SearchTypesEnum.PROBABILITY, {
    minValue: 1,
    maxValue: 200,
  }),
];

interface WordSearchFormProps {
  loadWords: (params: { searchCriteria: any[]; lexicon: string }) => void;
}

const WordSearchForm: React.FC<WordSearchFormProps> = (props) => {
  const [lexicon, setLexicon] = useState<string>("NWL23");

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const searchSubmit = () => {
    props.loadWords({
      searchCriteria: searchCriteria.map((s) => s.toJSObj()),
      lexicon,
    });
  };

  return (
    <form>
      <div className="row">
        <div className="col-xs-6">
          <Select
            colSize={6}
            label="Lexicon"
            selectedValue={lexicon}
            options={lexOptions}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setLexicon(event.target.value);
            }}
          />
        </div>
      </div>

      <div className="row" style={{ marginTop: 15 }}>
        <div className="col-xs-12">
          <SearchRows
            searches={searchCriteria}
            addSearchRow={addSearchRow}
            removeSearchRow={removeSearchRow}
            modifySearchType={searchTypeChange}
            modifySearchParam={searchParamChange}
            allowedSearchTypes={allowedSearchTypes}
          />
        </div>
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <div className="col-xs-4">
          <button
            className="btn btn-primary"
            type="button"
            onClick={searchSubmit}
          >
            Create Flashcard Quiz
          </button>
        </div>
      </div>
    </form>
  );
};

export default WordSearchForm;
