/**
 * @fileOverview A dialog for the end of the game, that will allow the
 * user to select what to do.
 */

import React from 'react';
import Immutable from 'immutable';

import Solutions from './solutions';

const DIALOG_TYPE_CHOOSER = 1;
const DIALOG_TYPE_SOLUTIONS = 2;
const DIALOG_TYPE_CHALLENGE_RESULTS = 3;

class GameEndDialog extends React.Component {
  // If we are here, game is not going AND number of rounds is not 0.
  // (The round may have just ended).
  constructor() {
    super();
    this.state = {
      shownDialog: DIALOG_TYPE_CHOOSER,
    };
  }

  // renderChooser() {
  //   return (
  //     <div />
  //   );
  // }

  renderSolutions() {
    return (
      <Solutions
        questions={this.props.origQuestions}
        answeredByMe={this.props.answeredByMe}
        totalWords={this.props.totalWords}
        height={this.props.height}
        markMissed={this.props.markMissed}
        showLexiconSymbols={this.props.showLexiconSymbols}
      />);
  }

  render() {
    if (this.state.shownDialog === DIALOG_TYPE_CHOOSER) {
      // return renderChooser();
    } else if (this.state.shownDialog === DIALOG_TYPE_SOLUTIONS) {
      return this.renderSolutions();
    } else if (this.state.shownDialog === DIALOG_TYPE_CHALLENGE_RESULTS) {
      // return renderChallengeResults();
    }
    return <div />;
  }

}

GameEndDialog.propTypes = {
  origQuestions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
};

