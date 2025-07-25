/**
 * @fileOverview A simple React component that displays a word, or
 * a set of front/back hooks.
 */
import React from 'react';

import Utils from './utils';

interface WordPartDisplayProps {
  classes?: string;
  text: string;
}

function WordPartDisplay({ classes, text }: WordPartDisplayProps) {
  return <span className={classes}>{Utils.displaySpanishDigraphs(text)}</span>;
}

export default WordPartDisplay;
