import React from 'react';
import PropTypes from 'prop-types';

import BlankSearchDialog from './dialog';

import { SearchTypesEnum, searchCriterionToAdd, SearchCriterion } from '../search/types';

import WordwallsAPI from '../../wordwalls_api';

const allowedSearchTypes = new Set([
  SearchTypesEnum.FIXED_LENGTH,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_TWO_BLANKS,
]);


class DialogContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchCriteria: [
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
    };

    this.searchSubmit = this.searchSubmit.bind(this);
  }
}