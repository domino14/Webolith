import PropTypes from 'prop-types';
import React from 'react';

import { SearchTypesEnum, SearchTypesOrder } from './types';

const SingleHelpNode = props => (
  <div>
    <h4>{SearchTypesEnum.properties[props.searchType].displayName}</h4>
    <div>{SearchTypesEnum.properties[props.searchType].description}</div>
  </div>);

SingleHelpNode.propTypes = {
  searchType: PropTypes.number.isRequired,
};

class HelpText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showingText: false,
    };
  }

  toggleShow() {
    this.setState(state => ({
      showingText: !state.showingText,
    }));
  }

  renderText() {
    if (!this.state.showingText) {
      return null;
    }
    return SearchTypesOrder.map((st) => {
      if (!this.props.allowedSearchTypes.has(st)) {
        return null;
      }
      return <SingleHelpNode searchType={st} />;
    });
  }

  render() {
    return (
      <div>
        <a onClick={() => this.toggleShow()}>Show help</a>
        {this.renderText()}
      </div>);
  }
}

HelpText.propTypes = {
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

export default HelpText;
