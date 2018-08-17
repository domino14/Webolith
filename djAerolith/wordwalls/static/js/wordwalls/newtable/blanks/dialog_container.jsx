import React from 'react';
import PropTypes from 'prop-types';

import BlankSearchDialog from '../search/dialog';
import ContainerWithSearchRows from '../dialog_container_with_search_rows';

import { SearchTypesEnum, SearchCriterion } from '../search/types';

import WordwallsAPI from '../../wordwalls_api';

const allowedSearchTypes = new Set([
  SearchTypesEnum.FIXED_LENGTH,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_TWO_BLANKS,
]);


class BlanksDialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.flashcardSearchSubmit = this.flashcardSearchSubmit.bind(this);
  }

  searchSubmit() {
    this.props.showSpinner();
  }

  flashcardSearchSubmit() {
    this.props.showSpinner();
  }

  render() {
    return (
      <BlankSearchDialog
        onSearchSubmit={this.searchSubmit}
        onFlashcardSubmit={this.flashcardSearchSubmit}
        allowedSearchTypes={allowedSearchTypes}
        {...this.props}
      />);
  }
}

BlanksDialogContainer.propTypes = {
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
  BlanksDialogContainer,
  allowedSearchTypes,
  [
    new SearchCriterion(SearchTypesEnum.FIXED_LENGTH, {
      value: 7,
    }),
    new SearchCriterion(SearchTypesEnum.NUM_ANAGRAMS, {
      minValue: 1,
      maxValue: 10,
    }),
    new SearchCriterion(SearchTypesEnum.NUM_TWO_BLANKS, {
      value: 4,
    }),
  ],
);

export default DialogContainer;
