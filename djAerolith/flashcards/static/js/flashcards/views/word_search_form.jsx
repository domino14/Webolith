/**
 * @fileOverview This is an adapter file to avoid translating the entire
 * flashcards codebase to React for now. We import the search row and the
 * relevant other modules from the wordwalls files. We use es6 in this
 * file.
 */
import React from 'react';
import PropTypes from 'prop-types';

import SearchRows from '../../../../../wordwalls/static/js/wordwalls/newtable/search_rows';
import { SearchTypesEnum,
  searchCriterionToAdd } from '../../../../../wordwalls/static/js/wordwalls/newtable/search_row';

import Select from '../../../../../wordwalls/static/js/wordwalls/forms/select';

class WordSearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wordSearchCriteria: [{
        searchType: SearchTypesEnum.LENGTH,
        minValue: 7,
        maxValue: 7,
      }, {
        searchType: SearchTypesEnum.PROBABILITY,
        minValue: 1,
        maxValue: 100,
      }],
      showStars: 'true',
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
      wordSearchCriteria: criteria,
    });
  }

  modifySearchType(index, value) {
    const criteria = this.state.wordSearchCriteria;
    const searchType = parseInt(value, 10);
    criteria[index].searchType = searchType;
    // Reset the values.
    if (searchType !== SearchTypesEnum.TAGS) {
      criteria[index].minValue = SearchTypesEnum.properties[searchType].defaultMin;
      criteria[index].maxValue = SearchTypesEnum.properties[searchType].defaultMax;
      this.setState({
        showStars: 'false',
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
    return this.state.wordSearchCriteria.map(criterion => Object.assign({}, criterion, {
      searchType: SearchTypesEnum.properties[criterion.searchType].name,
    }));
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
            />
          </div>
        </div>

        <div className="row">
          <div className="col-xs-6">
            <Select
              colSize={6}
              label="Show star ratings first time"
              selectedValue={this.state.showStars}
              options={[{ value: 'true', displayValue: 'Yes' },
                        { value: 'false', displayValue: 'No' }]}
              onChange={(event) => {
                this.setState({
                  showStars: event.target.value,
                });
              }}
            />
          </div>
        </div>

        <div className="row" style={{ marginBottom: 10 }}>
          <div className="col-xs-3">
            <button
              className="btn btn-primary"
              onClick={() => {
                this.props.loadWords({
                  searchCriteria: this.searchCriteriaMapper(),
                  showStars: this.state.showStars,
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
