/**
 * @fileOverview A simple React component that displays a word, or
 * a set of front/back hooks.
 */
import React from 'react';
import Utils from './utils';

const WordPartDisplay = props =>
  <span
    className={props.classes}
  >{Utils.displaySpanishDigraphs(props.text)}</span>;

WordPartDisplay.propTypes = {
  classes: React.PropTypes.string,
  text: React.PropTypes.string,
};

export default WordPartDisplay;
