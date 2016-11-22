/**
 * @fileOverview A dialog for the end of the game, that will allow the
 * user to select what to do.
 */

import React from 'react';
import Immutable from 'immutable';
import $ from 'jquery';

import Solutions from './solutions';
import ChallengeResults from './challenge_results';

const DIALOG_TYPE_CHOOSER = 1;
const DIALOG_TYPE_SOLUTIONS = 2;

class GameEndDialog extends React.Component {
  // If we are here, game is not going AND number of rounds is not 0.
  // (The round may have just ended).
  constructor() {
    super();
    this.state = {
      shownDialog: DIALOG_TYPE_CHOOSER,
    };
    this.onShowSolutions = this.onShowSolutions.bind(this);
  }

  onShowSolutions() {
    this.setState({
      shownDialog: DIALOG_TYPE_SOLUTIONS,
    });
  }

  renderChooser() {
    let challengeButton = null;
    let challengeModal = null;
    if (this.props.isChallenge) {
      challengeButton = (
        <div className="col-md-6 col-sm-12">
          <button
            className="btn btn-primary btn-lg"
            role="button"
            onClick={() => $('.challenge-results-modal').modal()}
          >Show challenge results</button>
        </div>
      );
      challengeModal = (
        <ChallengeResults
          challengeData={this.props.challengeData}
        />);
    }
    return (
      <div className="jumbotron">
        <h1>Game over!</h1>
        <p>You can continue by clicking Start again, or view solutions / results
        below.</p>
        <div className="row">
          <div className="col-md-6 col-sm-12">
            <button
              className="btn btn-primary btn-lg"
              onClick={this.onShowSolutions}
            >Show solutions</button>
          </div>
          {challengeButton}
        </div>
        {challengeModal}
      </div>
    );
  }

  renderSolutions() {
    return (
      <Solutions
        questions={this.props.questions}
        answeredByMe={this.props.answeredByMe}
        totalWords={this.props.totalWords}
        height={this.props.height}
        markMissed={this.props.markMissed}
        showLexiconSymbols={this.props.showLexiconSymbols}
      />);
  }

  render() {
    if (this.state.shownDialog === DIALOG_TYPE_CHOOSER) {
      return this.renderChooser();
    } else if (this.state.shownDialog === DIALOG_TYPE_SOLUTIONS) {
      return this.renderSolutions();
    }
    return null;
  }

}

GameEndDialog.propTypes = {
  questions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
  isChallenge: React.PropTypes.bool,
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
};

export default GameEndDialog;

