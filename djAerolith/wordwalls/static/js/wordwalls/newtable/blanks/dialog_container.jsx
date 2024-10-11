import React from 'react';
import PropTypes from 'prop-types';

import { SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';
import useSearchRows from 'wordvaultapp/search/use_search_rows';
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
function pbToQuestions(pb) {
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

const initialCriteria = [
  new SearchCriterion(SearchTypesEnum.FIXED_LENGTH, { value: 7 }),
  new SearchCriterion(SearchTypesEnum.MAX_SOLUTIONS, { value: 5 }),
  new SearchCriterion(SearchTypesEnum.NUM_TWO_BLANKS, { value: 4 }),
];

function BlanksDialogContainer(props) {
  const {
    searchCriteria,
    addSearchRow,
    removeSearchRow,
    searchParamChange,
    searchTypeChange,
  } = useSearchRows(initialCriteria, allowedSearchTypes);

  const getLexiconName = () => {
    const lexicon = props.availableLexica.find((el) => el.id === props.lexicon);
    return lexicon ? lexicon.lexicon : '';
  };

  const searchSubmit = () => {
    props.showSpinner();
    let wordLength;
    let maxSolutions;
    let num2Blanks;

    searchCriteria.forEach((search) => {
      switch (search.searchType) {
        case SearchTypesEnum.FIXED_LENGTH:
          wordLength = search.options.value;
          break;
        case SearchTypesEnum.MAX_SOLUTIONS:
          maxSolutions = search.options.value;
          break;
        case SearchTypesEnum.NUM_TWO_BLANKS:
          num2Blanks = search.options.value;
          break;
        default:
          throw new Error('Unhandled search type');
      }
    });

    const reqObj = new BlankChallengeCreateRequest({
      wordLength,
      numQuestions: props.questionsPerRound,
      lexicon: getLexiconName(),
      maxSolutions,
      numWith2Blanks: num2Blanks,
    });

    props.wordServerRPC
      .blankChallengeCreator(reqObj)
      .then((result) => props.api
        .call(RAW_QUESTIONS_URL, {
          lexicon: props.lexicon,
          rawQuestions: pbToQuestions(result),
          desiredTime: props.desiredTime,
          questionsPerRound: props.questionsPerRound,
          tablenum: props.tablenum,
        })
        .then((data) => props.onLoadNewList(data))
        .catch((error) => props.notifyError(error)))
      .catch((error) => {
        if (error.message.includes('timed out')) {
          props.notifyError(
            'Your query took too long; please try either fewer questions or a shorter word length.',
          );
        } else {
          props.notifyError(error);
        }
      })
      .finally(() => props.hideSpinner());
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
      {...props}
    />
  );
}

BlanksDialogContainer.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  lexicon: PropTypes.number.isRequired,
  availableLexica: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    lexicon: PropTypes.string,
    description: PropTypes.string,
  })).isRequired,
  desiredTime: PropTypes.number.isRequired,
  questionsPerRound: PropTypes.number.isRequired,
  notifyError: PropTypes.func.isRequired,
  redirectUrl: PropTypes.func.isRequired,
  tablenum: PropTypes.number.isRequired,
  onLoadNewList: PropTypes.func.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  api: PropTypes.instanceOf(WordwallsAPI).isRequired,
  wordServerRPC: PropTypes.shape({
    blankChallengeCreator: PropTypes.func,
  }).isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default BlanksDialogContainer;
