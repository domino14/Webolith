/* eslint-disable max-len */
import React, { useState } from 'react';
import { SearchTypesEnum, SearchTypesOrder } from 'wordvaultapp/search/types';

interface SingleHelpNodeProps {
  searchType: number;
}

function SingleHelpNode({ searchType }: SingleHelpNodeProps) {
  const searchTypeInfo = SearchTypesEnum.properties[searchType];
  const isHooks = searchTypeInfo.displayName === 'Contains Hooks';
  const isDefinition = searchTypeInfo.displayName === 'Definition Contains';

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ marginBottom: '8px' }}>{searchTypeInfo.displayName}</h4>
      <div style={{ lineHeight: '1.5' }}>{searchTypeInfo.description}</div>

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
          {' '}
          Searching for &quot;chess&quot; will find all words whose definitions mention chess.
        </div>
      )}
    </div>
  );
}

interface HelpTextProps {
  allowedSearchTypes: Set<number>;
}

function HelpText({ allowedSearchTypes }: HelpTextProps) {
  const [showingText, setShowingText] = useState(false);

  const toggleShow = () => {
    setShowingText(!showingText);
  };

  const renderText = () => {
    if (!showingText) {
      return null;
    }

    return SearchTypesOrder.map((st) => {
      if (!allowedSearchTypes.has(st)) {
        return null;
      }
      return <SingleHelpNode key={st} searchType={st} />;
    });
  };

  const buttonIcon = showingText ? '✕' : '?';
  const buttonText = showingText ? ' Hide Help' : ' Show Help';
  const buttonClass = showingText
    ? 'btn btn-sm btn-warning'
    : 'btn btn-sm btn-info';

  return (
    <div>
      <button
        type="button"
        className={buttonClass}
        onClick={toggleShow}
        style={{
          fontWeight: 'bold',
          marginBottom: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ fontSize: '16px', marginRight: '5px' }}>{buttonIcon}</span>
        {buttonText}
      </button>
      {showingText && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '10px',
        }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Search Criteria Help</h3>
          {renderText()}
        </div>
      )}
    </div>
  );
}

export default HelpText;
