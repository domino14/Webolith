/**
 * @fileOverview This is an adapter file to avoid translating the entire
 * flashcards codebase to React for now. We import the search row and the
 * relevant other modules from the wordwalls files. We use es6 in this
 * file.
 */
import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from '../../../../../wordwalls/static/js/wordwalls/newtable/search/rows';
import { SearchTypesEnum,
  searchCriterionToAdd,
  SearchCriterion } from '../../../../../wordwalls/static/js/wordwalls/newtable/search/types';

import Select from '../../../../../wordwalls/static/js/wordwalls/forms/select';

const allowedSearchTypes = new Set([
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.TAGS,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
]);

class WordSearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wordSearchCriteria: [
        new SearchCriterion(SearchTypesEnum.LENGTH, {
          minValue: 7,
          maxValue: 7,
        }),
        new SearchCriterion(SearchTypesEnum.PROBABILITY, {
          minValue: 1,
          maxValue: 200,
        }),
      ],
      lexicon: 'America', // we will build a giant word wall
    };

    this.addSearchRow = this.addSearchRow.bind(this);
    this.removeSearchRow = this.removeSearchRow.bind(this);
    this.modifySearchParam = this.modifySearchParam.bind(this);
    this.modifySearchType = this.modifySearchType.bind(this);
  }

  addSearchRow() {
    const toadd = searchCriterionToAdd(this.state.wordSearchCriteria);
    if (!toadd) {
      return;
    }
    const newCriteria = this.state.wordSearchCriteria.concat(toadd);
    this.setState({
      wordSearchCriteria: newCriteria,
    });
  }

  removeSearchRow(criteriaIndex) {
    const currentCriteria = this.state.wordSearchCriteria;
    currentCriteria.splice(criteriaIndex, 1);
    this.setState({
      wordSearchCriteria: currentCriteria,
    });
  }

  modifySearchParam(index, paramName, paramValue) {
    const criteria = this.state.wordSearchCriteria;
    criteria[index].setOption(paramName, paramValue);
    this.setState({
      wordSearchCriteria: criteria,
    });
  }

  modifySearchType(index, value) {
    const criteria = this.state.wordSearchCriteria;
    const searchType = parseInt(value, 10);

    criteria[index].searchType = searchType;
    // Reset the values.
    if ([SearchTypesEnum.LENGTH, SearchTypesEnum.NUM_ANAGRAMS, SearchTypesEnum.NUM_VOWELS,
      SearchTypesEnum.POINTS, SearchTypesEnum.PROBABILITY].includes(searchType)) {
      // Defaults to two options for this criteria - min/max
      criteria[index].setOptions({
        minValue: SearchTypesEnum.properties[searchType].defaultMin,
        maxValue: SearchTypesEnum.properties[searchType].defaultMax,
      });
    } else if (searchType === SearchTypesEnum.FIXED_LENGTH) {
      criteria[index].setOptions({
        value: SearchTypesEnum.properties[searchType].default,
      });
    } else if (searchType === SearchTypesEnum.TAGS) {
      criteria[index].setOptions({
        valueList: '',
      });
    }
    this.setState({
      wordSearchCriteria: criteria,
    });
  }

  /**
   * Turn the search criteria into something the back end would understand.
   * Copied verbatim from table_creator.jsx
   * @return {Array.<Object>}
   */
  searchCriteriaMapper() {
    return this.state.wordSearchCriteria.map(criterion => criterion.toJSObj());
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
              options={[{
                value: 'America',
                displayValue: 'America',
              }, {
                value: 'CSW15',
                displayValue: 'CSW15',
              }]}
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
              searches={this.state.wordSearchCriteria}
              addSearchRow={this.addSearchRow}
              removeSearchRow={this.removeSearchRow}
              modifySearchType={this.modifySearchType}
              modifySearchParam={this.modifySearchParam}
              allowedSearchTypes={allowedSearchTypes}
            />
          </div>
        </div>

        <div className="row" style={{ marginBottom: 10 }}>
          <div className="col-xs-3">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                this.props.loadWords({
                  searchCriteria: this.searchCriteriaMapper(),
                  lexicon: this.state.lexicon,
                });
              }}
            >Search
            </button>
          </div>
        </div>

      </form>
    );
  }
}

WordSearchForm.propTypes = {
  loadWords: PropTypes.func.isRequired,
};

export default WordSearchForm;
