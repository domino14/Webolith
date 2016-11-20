import React from 'react';
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

    if (!this.props.correct) {
      qTdClass = 'danger';
    }
    if (!this.props.wordSolved) {
      wTdClass += ' danger';
    }
    const wordDisplay = (this.props.innerFrontHook ? '･' : '') + this.props.word +
      (this.props.innerBackHook ? '･' : '') + this.props.lexiconSymbols;

    if (this.props.correct && this.props.wordPos === 0) {
      markMissedBtn = (
        <button
          className="btn btn-sm btn-danger"
          onClick={this.markMissed}
        >Mark missed</button>
      );
    }
    const alphagram = (
      this.props.wordPos === 0 ? (<WordPartDisplay
        text={this.props.alphagram}
      />) : '');

    return (
      <tr>
        <td>{
          this.props.wordPos === 0 ? this.props.probability : ''}</td>
        <td
          className={qTdClass}
        >{alphagram}</td>
        <td
          className="text-right"
        >
          <WordPartDisplay
            classes="text-info small"
            text={this.props.frontHooks}
          /></td>
        <td className={wTdClass}>
          <WordPartDisplay
            text={wordDisplay}
          /></td>
        <td
          className="text-left"
        >
          <WordPartDisplay
            classes="text-info small"
            text={this.props.backHooks}
          /></td>
        <td>{this.props.definition}</td>
        <td>{markMissedBtn}</td>
      </tr>
    );
  }
}

Solution.propTypes = {
  markMissed: React.PropTypes.func,
  idx: React.PropTypes.number,
  alphagram: React.PropTypes.string,
  correct: React.PropTypes.bool,
  wordSolved: React.PropTypes.bool,
  innerFrontHook: React.PropTypes.bool,
  innerBackHook: React.PropTypes.bool,
  word: React.PropTypes.string,
  lexiconSymbols: React.PropTypes.string,
  wordPos: React.PropTypes.number,
  probability: React.PropTypes.number,
  frontHooks: React.PropTypes.string,
  backHooks: React.PropTypes.string,
  definition: React.PropTypes.string,
};

export default Solution;
