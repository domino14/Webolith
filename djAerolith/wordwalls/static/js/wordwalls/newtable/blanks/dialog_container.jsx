import React from 'react';
import PropTypes from 'prop-types';

import BlankSearchDialog from '../search/dialog';
import ContainerWithSearchRows from '../dialog_container_with_search_rows';

import { SearchTypesEnum, SearchCriterion } from '../search/types';

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
  const alphList = pb.alphagramsList;
  const rawQs = alphList.map((alph) => {
    const words = alph.wordsList;
    const wl = words.map((w) => w.word);
    return {
      q: alph.alphagram,
      a: wl,
    };
  });
  return rawQs;
}

class BlanksDialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.searchSubmit = this.searchSubmit.bind(this);
  }

  // Return the NAME of the lexicon, rather than the number.
  // word_db_server requires the lexicon name.
  getLexiconName() {
    return this.props.availableLexica.find((el) => el.id === this.props.lexicon).lexicon;
  }

  searchSubmit() {
    this.props.showSpinner();
    let wordLength;
    let maxSolutions;
    let num2Blanks;
    this.props.searches.forEach((search) => {
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
      numQuestions: this.props.questionsPerRound,
      lexicon: this.getLexiconName(),
      maxSolutions,
      numWith2Blanks: num2Blanks,
    });

    this.props.wordServerRPC.blankChallengeCreator(reqObj)
      .then((result) => this.props.api.call(RAW_QUESTIONS_URL, {
        lexicon: this.props.lexicon,
        rawQuestions: pbToQuestions(result),
        desiredTime: this.props.desiredTime,
        questionsPerRound: this.props.questionsPerRound,
        tablenum: this.props.tablenum,
      })
        .then((data) => this.props.onLoadNewList(data))
        .catch((error) => this.props.notifyError(error)))
      .catch((error) => {
        if (error.message.includes('timed out')) {
          this.props.notifyError([
            'Your query took too long; please try either fewer questions ',
            'or a shorter word length.',
          ].join(''));
        } else {
          this.props.notifyError(error);
        }
      })
      .finally(() => this.props.hideSpinner());
  }

  render() {
    return (
      <BlankSearchDialog
        onSearchSubmit={this.searchSubmit}
        flashcardAllowed={false}
        allowedSearchTypes={allowedSearchTypes}
        {...this.props}
      />
    );
  }
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

const DialogContainer = ContainerWithSearchRows(
  BlanksDialogContainer,
  allowedSearchTypes,
  [
    new SearchCriterion(SearchTypesEnum.FIXED_LENGTH, {
      value: 7,
    }),
    new SearchCriterion(SearchTypesEnum.MAX_SOLUTIONS, {
      value: 5,
    }),
    new SearchCriterion(SearchTypesEnum.NUM_TWO_BLANKS, {
      value: 4,
    }),
  ],
);

export default DialogContainer;
