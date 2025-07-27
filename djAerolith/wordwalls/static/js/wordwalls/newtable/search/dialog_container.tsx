import React, { useMemo } from 'react';

import { SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';
import useSearchRows from 'wordvaultapp/search/use_search_rows';
import WordSearchDialog from './dialog';

import WordwallsAPI from '../../wordwalls_api';

const SEARCH_URL = '/wordwalls/api/new_search/';
const FLASHCARD_URL = '/flashcards/';

const allowedSearchTypes = new Set([
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
  SearchTypesEnum.DELETED_WORD,
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
]);

interface SearchDialogContainerProps {
  lexicon: number;
  desiredTime: number;
  questionsPerRound: number;
  tablenum: number;
  notifyError: (error: Error | string) => void;
  redirectUrl: (url: string) => void;
  onLoadNewList: (data: unknown) => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  api: WordwallsAPI;
  disabled: boolean;
  darkMode?: boolean;
}

function SearchDialogContainer({
  lexicon,
  desiredTime,
  questionsPerRound,
  tablenum,
  notifyError,
  redirectUrl,
  onLoadNewList,
  showSpinner,
  hideSpinner,
  api,
  disabled,
  darkMode = false,
}: SearchDialogContainerProps) {
  // Memoize initial search criteria to prevent new objects on every render
  const initialSearchCriteria = useMemo(() => [
    new SearchCriterion(SearchTypesEnum.LENGTH, {
      minValue: 7,
      maxValue: 7,
    }),
    new SearchCriterion(SearchTypesEnum.PROBABILITY, {
      minValue: 1,
      maxValue: 200,
    }),
  ], []);

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialSearchCriteria, allowedSearchTypes);

  const searchSubmit = () => {
    showSpinner();
    api.call(SEARCH_URL, {
      lexicon,
      searchCriteria: searchCriteria.map((s) => s.toJSObj()),
      desiredTime,
      questionsPerRound,
      tablenum,
    })
      .then((data) => onLoadNewList(data))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
  };

  /**
   * Submit search params to flashcard function. We use a legacy
   * "WhitleyCards" API here, which is not quite JSON. This will have
   * to be moved over to my new Cards program in the future.
   */
  const flashcardSearchSubmit = () => {
    showSpinner();
    api.callLegacy(FLASHCARD_URL, {
      action: 'searchParamsFlashcard',
      lexicon,
      searchCriteria: searchCriteria.map((s) => s.toJSObj()),
    })
      .then((data) => redirectUrl(data.url))
      .catch((resp) => notifyError(resp))
      .finally(() => hideSpinner());
  };

  return (
    <WordSearchDialog
      onSearchSubmit={searchSubmit}
      onFlashcardSubmit={flashcardSearchSubmit}
      allowedSearchTypes={allowedSearchTypes}
      searches={searchCriteria}
      addSearchRow={addSearchRow}
      removeSearchRow={removeSearchRow}
      onSearchTypeChange={searchTypeChange}
      onSearchParamChange={searchParamChange}
      lexicon={lexicon}
      desiredTime={desiredTime}
      questionsPerRound={questionsPerRound}
      tablenum={tablenum}
      notifyError={notifyError}
      redirectUrl={redirectUrl}
      onLoadNewList={onLoadNewList}
      showSpinner={showSpinner}
      hideSpinner={hideSpinner}
      api={api}
      disabled={disabled}
      darkMode={darkMode}
    />
  );
}

export default SearchDialogContainer;
