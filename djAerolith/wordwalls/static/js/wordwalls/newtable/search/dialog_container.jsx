import React from 'react';
import PropTypes from 'prop-types';

import WordSearchDialog from './dialog';
import { SearchTypesEnum, searchCriterionToAdd } from './types';
import WordwallsAPI from '../../wordwalls_api';

const SEARCH_URL = 'wordwalls/api/new_search/';
const FLASHCARD_URL = '/flashcards/';

class DialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchCriteria: [{
        searchType: SearchTypesEnum.LENGTH,
        minValue: 7,
        maxValue: 7,
      }, {
        searchType: SearchTypesEnum.PROBABILITY,
        minValue: 1,
        maxValue: 200,
      }],
    };

    this.searchSubmit = this.searchSubmit.bind(this);
    this.flashcardSearchSubmit = this.flashcardSearchSubmit.bind(this);

    this.searchParamChange = this.searchParamChange.bind(this);
    this.searchTypeChange = this.searchTypeChange.bind(this);
    this.addSearchRow = this.addSearchRow.bind(this);
    this.removeSearchRow = this.removeSearchRow.bind(this);
  }

  addSearchRow() {
    const toadd = searchCriterionToAdd(this.state.searchCriteria);
    if (!toadd) {
      return; // Don't add any more.
    }

    const newCriteria = this.state.searchCriteria.concat(toadd);
    this.setState({
      searchCriteria: newCriteria,
    });
  }

  removeSearchRow(criteriaIndex) {
    const currentCriteria = this.state.searchCriteria;
    currentCriteria.splice(criteriaIndex, 1);
    this.setState({
      searchCriteria: currentCriteria,
    });
  }

  searchParamChange(index, paramName, paramValue) {
    const criteria = this.state.searchCriteria;
    const valueModifier = (val) => {
      if (paramName === 'minValue' || paramName === 'maxValue') {
        return parseInt(val, 10) || 0;
      } else if (paramName === 'valueList') {
        return val.trim();
      }
      return val;
    };

    criteria[index][paramName] = valueModifier(paramValue);
    this.setState({
      searchCriteria: criteria,
    });
  }

  /**
   * Turn the search criteria into something the back end would understand.
   * @return {Array.<Object>}
   */
  searchCriteriaMapper() {
    // TODO modify me
    return this.state.searchCriteria.map(criterion => Object.assign({}, criterion, {
      searchType: SearchTypesEnum.properties[criterion.searchType].name,
    }));
  }

  searchTypeChange(index, value) {
    const criteria = this.state.searchCriteria;
    const searchType = parseInt(value, 10);
    criteria[index].searchType = searchType;
    // Reset the values.
    if (searchType !== SearchTypesEnum.TAGS) {
      criteria[index].minValue = SearchTypesEnum.properties[searchType].defaultMin;
      criteria[index].maxValue = SearchTypesEnum.properties[searchType].defaultMax;
    }
    this.setState({
      searchCriteria: criteria,
    });
  }

  searchSubmit() {
    this.props.showSpinner();
    this.props.api.call(SEARCH_URL, {
      lexicon: this.props.lexicon,
      searchCriteria: this.searchCriteriaMapper(),
      desiredTime: this.props.desiredTime,
      questionsPerRound: this.props.questionsPerRound,
      tablenum: this.props.tablenum,
    })
      .then(data => this.props.onLoadNewList(data))
      .catch(error => this.props.notifyError(error))
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
      searchCriteria: this.searchCriteriaMapper(),
    })
      .then(data => this.props.redirectUrl(data.url))
      .catch(resp => this.props.notifyError(resp))
      .finally(() => this.props.hideSpinner());
  }

  render() {
    return (
      <WordSearchDialog
        searches={this.state.searchCriteria}
        addSearchRow={this.addSearchRow}
        removeSearchRow={this.removeSearchRow}
        onSearchTypeChange={this.searchTypeChange}
        onSearchParamChange={this.searchParamChange}
        onSearchSubmit={this.searchSubmit}
        onFlashcardSubmit={this.flashcardSearchSubmit}
        disabled={this.props.disabled}
      />);
  }
}

DialogContainer.propTypes = {
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
  disabled: PropTypes.bool.isRequired,
  showSpinner: PropTypes.func.isRequired,
  hideSpinner: PropTypes.func.isRequired,
  api: PropTypes.instanceOf(WordwallsAPI).isRequired,
};

export default DialogContainer;
