import React, { useMemo } from 'react';

import { SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';
import useSearchRows from '../search/use_search_rows';
import BlankSearchDialog from '../search/dialog';

import WordwallsAPI from '../../wordwalls_api';

import { BlankChallengeCreateRequest } from '../../gen/wordsearcher/searcher_pb';

const RAW_QUESTIONS_URL = '/wordwalls/api/load_raw_questions/';

const allowedSearchTypes = new Set([
  SearchTypesEnum.FIXED_LENGTH,
  SearchTypesEnum.MAX_SOLUTIONS,
  SearchTypesEnum.NUM_TWO_BLANKS,
]);

/**
 * Convert the raw protobuf wordsearcher.SearchResponse object to a list of
 * raw question dictionaries.
 * Note: the pb object is not actually raw. The generated twirp code seems
 * to parse it into an intermediate object.
 */
function pbToQuestions(
  pb: { alphagrams: Array<{ alphagram: string; words: Array<{ word: string }> }> },
) {
  const rawQs = pb.alphagrams.map((alph) => {
    const { words } = alph;
    const wl = words.map((w) => w.word);
    return {
      q: alph.alphagram,
      a: wl,
    };
  });
  return rawQs;
}

// Moved inside component to prevent shared mutable state

interface Lexicon {
  id: number;
  lexicon: string;
  description: string;
}

interface BlanksDialogContainerProps {
  searches: SearchCriterion[];
  lexicon: number;
  availableLexica: Lexicon[];
  desiredTime: number;
  questionsPerRound: number;
  notifyError: (error: Error | string) => void;
  redirectUrl: (url: string) => void;
  tablenum: number;
  onLoadNewList: (data: unknown) => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  api: WordwallsAPI;
  wordServerRPC: {
    blankChallengeCreator: (
      req: BlankChallengeCreateRequest,
    ) => Promise<{ alphagrams: Array<{ alphagram: string; words: Array<{ word: string }> }> }>;
  };
  disabled: boolean;
}

function BlanksDialogContainer({
  availableLexica,
  lexicon,
  questionsPerRound,
  desiredTime,
  tablenum,
  showSpinner,
  hideSpinner,
  api,
  wordServerRPC,
  onLoadNewList,
  notifyError,
  ...restProps
}: BlanksDialogContainerProps) {
  // Memoize initial search criteria to prevent new objects on every render
  const initialCriteria = useMemo(() => [
    new SearchCriterion(SearchTypesEnum.FIXED_LENGTH, { value: 8 }),
    new SearchCriterion(SearchTypesEnum.MAX_SOLUTIONS, { value: 5 }),
  ], []);

  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const getLexiconName = () => {
    const lexiconObj = availableLexica.find((el) => el.id === lexicon);
    return lexiconObj ? lexiconObj.lexicon : '';
  };

  const searchSubmit = () => {
    showSpinner();
    let wordLength: number | undefined;
    let maxSolutions: number | undefined;
    let num2Blanks: number | undefined;

    searchCriteria.forEach((search) => {
      switch (search.searchType) {
        case SearchTypesEnum.FIXED_LENGTH:
          wordLength = search.options.value as number;
          break;
        case SearchTypesEnum.MAX_SOLUTIONS:
          maxSolutions = search.options.value as number;
          break;
        case SearchTypesEnum.NUM_TWO_BLANKS:
          num2Blanks = search.options.value as number;
          break;
        default:
          throw new Error('Unhandled search type');
      }
    });

    const reqObj = new BlankChallengeCreateRequest({
      wordLength,
      numQuestions: questionsPerRound,
      lexicon: getLexiconName(),
      maxSolutions,
      numWith2Blanks: num2Blanks,
    });

    wordServerRPC
      .blankChallengeCreator(reqObj)
      .then((result) => api
        .call(RAW_QUESTIONS_URL, {
          lexicon,
          rawQuestions: pbToQuestions(result),
          desiredTime,
          questionsPerRound,
          tablenum,
        })
        .then((data) => onLoadNewList(data))
        .catch((error) => notifyError(error)))
      .catch((error) => {
        if (error.message.includes('timed out')) {
          notifyError(
            'Your query took too long; please try either fewer questions or a shorter word length.',
          );
        } else {
          notifyError(error);
        }
      })
      .finally(() => hideSpinner());
  };

  return (
    <BlankSearchDialog
      onSearchSubmit={searchSubmit}
      flashcardAllowed={false}
      allowedSearchTypes={allowedSearchTypes}
      searches={searchCriteria}
      addSearchRow={addSearchRow}
      removeSearchRow={removeSearchRow}
      onSearchTypeChange={searchTypeChange}
      onSearchParamChange={searchParamChange}
      lexicon={lexicon}
      availableLexica={availableLexica}
      desiredTime={desiredTime}
      questionsPerRound={questionsPerRound}
      tablenum={tablenum}
      showSpinner={showSpinner}
      hideSpinner={hideSpinner}
      api={api}
      wordServerRPC={wordServerRPC}
      onLoadNewList={onLoadNewList}
      notifyError={notifyError}
      {...restProps}
    />
  );
}

export default BlanksDialogContainer;
