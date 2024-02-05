/**
 * @fileOverview This is an adapter file to avoid translating the entire
 * flashcards codebase to React for now. We import the search row and the
 * relevant other modules from the wordwalls files. We use es6 in this
 * file.
 */
import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from '../../../../../wordwalls/static/js/wordwalls/newtable/search/rows';
import {
  SearchTypesEnum,
  SearchCriterion,
} from '../../../../../wordwalls/static/js/wordwalls/newtable/search/types';

import Select from '../../../../../wordwalls/static/js/wordwalls/forms/select';
import ContainerWithSearchRows from '../../../../../wordwalls/static/js/wordwalls/newtable/dialog_container_with_search_rows';

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
]);

const lexOptions = [{
  value: 'NWL23',
  displayValue: 'NWL23',
}, {
  value: 'CSW21',
  displayValue: 'CSW21',
}];

class WordSearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.searchSubmit = this.searchSubmit.bind(this);

    this.state = {
      lexicon: 'NWL23',
    };
  }

  searchSubmit() {
    this.props.loadWords({
      searchCriteria: this.props.searches.map((s) => s.toJSObj()),
      lexicon: this.state.lexicon,
    });
  }

  render() {
    return (
      <form>
        <div className="row">
          <div className="col-xs-6">
            <Select
              colSize={6}
              label="Lexicon"
              selectedValue={this.state.lexicon}
              options={lexOptions}
              onChange={(event) => {
                this.setState({
                  lexicon: event.target.value,
                });
              }}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: 15 }}>
          <div className="col-xs-12">
            <SearchRows
              searches={this.props.searches}
              addSearchRow={this.props.addSearchRow}
              removeSearchRow={this.props.removeSearchRow}
              modifySearchType={this.props.onSearchTypeChange}
              modifySearchParam={this.props.onSearchParamChange}
              allowedSearchTypes={allowedSearchTypes}
            />
          </div>
        </div>

        <div className="row" style={{ marginBottom: 10 }}>
          <div className="col-xs-3">
            <button
              className="btn btn-primary"
              type="button"
              onClick={this.searchSubmit}
            >
              Search
            </button>
          </div>
        </div>

      </form>
    );
  }
}

WordSearchForm.propTypes = {
  searches: PropTypes.arrayOf(PropTypes.instanceOf(SearchCriterion)).isRequired,
  loadWords: PropTypes.func.isRequired,
  addSearchRow: PropTypes.func.isRequired,
  removeSearchRow: PropTypes.func.isRequired,
  onSearchTypeChange: PropTypes.func.isRequired,
  onSearchParamChange: PropTypes.func.isRequired,
};

const DialogContainer = ContainerWithSearchRows(
  WordSearchForm,
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
