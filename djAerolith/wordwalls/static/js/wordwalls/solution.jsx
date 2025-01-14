import React from 'react';
import PropTypes from 'prop-types';

import WordPartDisplay from './word_part_display';

class Solution extends React.Component {
  constructor() {
    super();
    this.markMissed = this.markMissed.bind(this);
  }

  markMissed() {
    this.props.markMissed(this.props.idx, this.props.alphagram);
  }

  render() {
    let qTdClass = '';
    let wTdClass = 'text-nowrap';
    let markMissedBtn;
    let rowStyle = {};

    if (!this.props.correct) {
      qTdClass = 'danger';
    } else if (this.props.wrongGuess) {
      qTdClass = 'warning';
    }
    if (!this.props.wordSolved) {
      wTdClass += ' danger';
    }
    const wordDisplay = (this.props.innerFrontHook ? '･' : '') + this.props.word
      + (this.props.innerBackHook ? '･' : '') + this.props.lexiconSymbols;

    if (this.props.correct && this.props.wordPos === 0) {
      markMissedBtn = (
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={this.markMissed}
        >
          Mark missed
        </button>
      );
    }
    const alphagram = (
      this.props.wordPos === 0 ? (
        <WordPartDisplay
          text={this.props.alphagram}
        />
      ) : '');

    // Visually separate different alphagrams.
    if (this.props.wordPos === 0) {
      rowStyle = { borderTop: '1px solid #777777' };
    }

    return (
      <tr>
        <td style={rowStyle}>
          {
          this.props.wordPos === 0 ? this.props.probability : ''
}
        </td>
        {this.props.difficulty ? <td className={this.props.difficulty > 80 ? 'text-danger' : ''} style={rowStyle}>{this.props.wordPos === 0 ? this.props.difficulty: ''}</td> : null}
        <td
          style={rowStyle}
          className={qTdClass}
        >
          {alphagram}
        </td>
        <td
          style={rowStyle}
          className="text-right"
        >
          <WordPartDisplay
            classes="text-info small"
            text={this.props.frontHooks}
          />
        </td>
        <td className={wTdClass} style={rowStyle}>
          <WordPartDisplay
            text={wordDisplay}
          />
        </td>
        <td
          className="text-left"
          style={rowStyle}
        >
          <WordPartDisplay
            classes="text-info small"
            text={this.props.backHooks}
          />
        </td>
        <td style={{ ...rowStyle, ...{ whiteSpace: 'pre-wrap' } }}>{this.props.definition}</td>
        <td style={rowStyle}>{markMissedBtn}</td>
      </tr>
    );
  }
}

Solution.propTypes = {
  markMissed: PropTypes.func.isRequired,
  idx: PropTypes.number.isRequired,
  alphagram: PropTypes.string.isRequired,
  correct: PropTypes.bool.isRequired,
  wrongGuess: PropTypes.bool.isRequired,
  wordSolved: PropTypes.bool.isRequired,
  innerFrontHook: PropTypes.bool.isRequired,
  innerBackHook: PropTypes.bool.isRequired,
  word: PropTypes.string.isRequired,
  lexiconSymbols: PropTypes.string.isRequired,
  wordPos: PropTypes.number.isRequired,
  probability: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  frontHooks: PropTypes.string.isRequired,
  backHooks: PropTypes.string.isRequired,
  definition: PropTypes.string.isRequired,
  difficulty: PropTypes.number.isRequired,
};

export default Solution;
