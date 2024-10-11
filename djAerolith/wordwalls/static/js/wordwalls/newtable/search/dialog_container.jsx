import React from 'react';
import PropTypes from 'prop-types';

import { SearchTypesEnum, SearchCriterion } from 'wordvaultapp/search/types';
import ContainerWithSearchRows from '../dialog_container_with_search_rows';
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
]);

class SearchDialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.flashcardSearchSubmit = this.flashcardSearchSubmit.bind(this);
  }

  searchSubmit() {
    this.props.showSpinner();
    this.props.api.call(SEARCH_URL, {
      lexicon: this.props.lexicon,
      searchCriteria: this.props.searches.map((s) => s.toJSObj()),
      desiredTime: this.props.desiredTime,
      questionsPerRound: this.props.questionsPerRound,
      tablenum: this.props.tablenum,
    })
      .then((data) => this.props.onLoadNewList(data))
      .catch((error) => this.props.notifyError(error))
      .finally(() => this.props.hideSpinner());
  }

  /**
   * Submit search params to flashcard function. We use a legacy
   * "WhitleyCards" API here, which is not quite JSON. This will have
   * to be moved over to my new Cards program in the future.
   */
  flashcardSearchSubmit() {
    this.props.showSpinner();
    this.props.api.callLegacy(FLASHCARD_URL, {
      action: 'searchParamsFlashcard',
      lexicon: this.props.lexicon,
      searchCriteria: this.props.searches.map((s) => s.toJSObj()),
    })
      .then((data) => this.props.redirectUrl(data.url))
      .catch((resp) => this.props.notifyError(resp))
      .finally(() => this.props.hideSpinner());
  }

  render() {
    return (
      <WordSearchDialog
        onSearchSubmit={this.searchSubmit}
        onFlashcardSubmit={this.flashcardSearchSubmit}
        allowedSearchTypes={allowedSearchTypes}
        {...this.props}
      />
    );
  }
}

SearchDialogContainer.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  lexicon: PropTypes.number.isRequired,
  desiredTime: PropTypes.number.isRequired,
  questionsPerRound: PropTypes.number.isRequired,
  notifyError: PropTypes.func.isRequired,
  redirectUrl: PropTypes.func.isRequired,
  // availableLexica: PropTypes.arrayOf(PropTypes.shape({
  //   id: PropTypes.number,
  //   lexicon: PropTypes.string,
  //   description: PropTypes.string,
  //   counts: PropTypes.object,
  // })).isRequired,
  tablenum: PropTypes.number.isRequired,
  onLoadNewList: PropTypes.func.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  api: PropTypes.instanceOf(WordwallsAPI).isRequired,
  disabled: PropTypes.bool.isRequired,
};

const DialogContainer = ContainerWithSearchRows(
  SearchDialogContainer,
  allowedSearchTypes,
  [
    new SearchCriterion(SearchTypesEnum.LENGTH, {
      minValue: 7,
      maxValue: 7,
    }),
    new SearchCriterion(SearchTypesEnum.PROBABILITY, {
      minValue: 1,
      maxValue: 200,
    }),
  ],
);

export default DialogContainer;
