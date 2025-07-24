/* eslint-disable max-len */
import PropTypes from 'prop-types';
import React from 'react';

import { SearchTypesEnum, SearchTypesOrder } from 'wordvaultapp/search/types';

function SingleHelpNode(props) {
  const searchType = SearchTypesEnum.properties[props.searchType];
  const isHooks = searchType.displayName === 'Contains Hooks';
  const isDefinition = searchType.displayName === 'Definition Contains';

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ marginBottom: '8px' }}>{searchType.displayName}</h4>
      <div style={{ lineHeight: '1.5' }}>{searchType.description}</div>

      {isHooks && (
        <div style={{ marginTop: '10px', paddingLeft: '10px', borderLeft: '3px solid #ddd' }}>
          <strong>Hook Types:</strong>
          <ul style={{ marginTop: '5px' }}>
            <li>
              <strong>Front Hooks:</strong>
              {' '}
              Letters that can be added to the beginning of a word to form a new valid word. For example, &#39;S&#39; is a front hook for &#39;CARE&#39; to make &#39;SCARE&#39;.
            </li>
            <li>
              <strong>Back Hooks:</strong>
              {' '}
              Letters that can be added to the end of a word to form a new valid word. For example, &#39;S&#39; is a back hook for &#39;CAR&#39; to make &#39;CARS&#39;.
            </li>
          </ul>
          <strong>Example usage:</strong>
          {' '}
          Enter &quot;AEST&quot; in the Hooks field to find words that can take any of those letters as the specified hook type.
        </div>
      )}

      {isDefinition && (
        <div style={{ marginTop: '10px', paddingLeft: '10px', borderLeft: '3px solid #ddd' }}>
          <strong>How it works:</strong>
          <ul style={{ marginTop: '5px' }}>
            <li>Searches are case-insensitive</li>
            <li>Partial matches are supported (e.g., searching for &quot;bird&quot; will match &quot;blackbird&quot;, &quot;songbird&quot;, etc.)</li>
            <li>Multiple words can be searched by separating with spaces</li>
          </ul>
          <strong>Example:</strong>
          Searching for &quot;chess&quot; will find all words whose definitions mention chess.
        </div>
      )}
    </div>
  );
}

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
    this.setState((state) => ({
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
      return <SingleHelpNode key={st} searchType={st} />;
    });
  }

  render() {
    const buttonIcon = this.state.showingText ? '✕' : '?';
    const buttonText = this.state.showingText ? ' Hide Help' : ' Show Help';
    const buttonClass = this.state.showingText
      ? 'btn btn-sm btn-warning'
      : 'btn btn-sm btn-info';

    return (
      <div>
        <button
          type="button"
          className={buttonClass}
          onClick={() => this.toggleShow()}
          style={{
            fontWeight: 'bold',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <span style={{ fontSize: '16px', marginRight: '5px' }}>{buttonIcon}</span>
          {buttonText}
        </button>
        {this.state.showingText && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            marginTop: '10px',
          }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Search Criteria Help</h3>
            {this.renderText()}
          </div>
        )}
      </div>
    );
  }
}

HelpText.propTypes = {
  allowedSearchTypes: PropTypes.instanceOf(Set).isRequired,
};

export default HelpText;
