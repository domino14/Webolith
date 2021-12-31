/**
 * @fileOverview A simple React component that displays a word, or
 * a set of front/back hooks.
 */
import React from 'react';
import PropTypes from 'prop-types';

import Utils from './utils';

function WordPartDisplay(props) {
  return (
    <span
      className={props.classes}
    >
      {Utils.displaySpanishDigraphs(props.text)}
    </span>
  );
}

WordPartDisplay.defaultProps = {
  classes: null,
};

WordPartDisplay.propTypes = {
  classes: PropTypes.string,
  text: PropTypes.string.isRequired,
};

export default WordPartDisplay;
