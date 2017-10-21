/**
 * @fileOverview A hero unit for when game is inactive, that will allow the
 * user to select what to do.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import SolutionsModal from './solutions_modal';
import ChallengeResultsModal from './challenge_results_modal';
import StartButton from './start_button';
import HeroButton from './hero_button';

const BUTTON_STATE_IDLE = 1;
const BUTTON_STATE_COUNTING_DOWN = 2;
const COUNTDOWN_SECS = 3;

class GameInactiveArea extends React.Component {
  constructor() {
    super();
    this.state = {
      startButtonState: BUTTON_STATE_IDLE,
    };
    this.countdownTimeout = null;
    this.handleStartClick = this.handleStartClick.bind(this);
  }

  handleStartClick() {
    if (this.state.startButtonState === BUTTON_STATE_IDLE) {
      if (this.props.canStart) {
        this.setState({
          startButtonState: BUTTON_STATE_COUNTING_DOWN,
        });
        this.countdownTimeout = window.setTimeout(() => {
          this.props.handleStart();
          this.setState({
            startButtonState: BUTTON_STATE_IDLE,
          });
        }, COUNTDOWN_SECS * 1000);
        this.props.handleStartCountdown(COUNTDOWN_SECS);
      } else {
        // Try to start the game right away. This will send a message to the
        // server telling everyone that this user wants to start the game,
        // but won't actually start it.
        this.props.handleStart();
      }
    } else if (this.state.startButtonState === BUTTON_STATE_COUNTING_DOWN) {
      this.setState({
        startButtonState: BUTTON_STATE_IDLE,
      });
      window.clearTimeout(this.countdownTimeout);
      this.props.handleStartCountdownCancel();
    }
  }

  /**
   * Render the table "management" buttons, ie create new table, leave table.
   * @return {React.Component}
   */
  renderTableManagementButtons() {
    return (
      <div className="row">
        <hr style={{ borderTop: '1px solid #ccc' }} />
        <HeroButton
          addlButtonClass="btn-info"
          onClick={this.props.resetTableCreator}
          modalSelector={this.props.tableCreatorModalSelector}
          buttonText="Load New Word List"
        />
        <HeroButton
          addlButtonClass="btn-danger"
          onClick={() => {
            window.location.href = '/';
          }}
          buttonText="Back to main page"
        />
      </div>
    );
  }

  renderJumbotronHeader() {
    let jumbotronHeader = null;
    let challengeButton = null;
    const startButton = (
      <StartButton
        buttonText={
          this.state.startButtonState === BUTTON_STATE_COUNTING_DOWN ?
          'Cancel' : 'Start'
        }
        buttonClass={
          this.state.startButtonState === BUTTON_STATE_COUNTING_DOWN ?
          'btn btn-warning btn-lg' : 'btn btn-primary btn-lg'
        }
        handleButtonClick={this.handleStartClick}
      />);

    if (this.props.isChallenge) {
      challengeButton = (
        <HeroButton
          addlButtonClass="btn-primary"
          modalSelector=".challenge-results-modal"
          buttonText="Show Challenge Results"
        />
      );
    }
    if (this.props.startCountingDown) {
      const s = this.props.startCountdown > 1 ? 's' : '';
      const str = `Game starting in ${this.props.startCountdown} second${s}...`;
      jumbotronHeader = (
        <div>
          <h1>{str}</h1>
          <h1>{startButton}</h1>
        </div>
      );
    } else if (this.props.numberOfRounds > 0) {
      jumbotronHeader = (
        <div>
          <h1>Game over!</h1>
          <p>You can continue by clicking {startButton} again, or
          view solutions / results below.
          </p>
          <div className="row">
            <HeroButton
              addlButtonClass="btn-primary"
              modalSelector=".solutions-modal"
              buttonText="Show solutions"
            />
            {challengeButton}
          </div>
        </div>
      );
    } else if (!this.props.listName) {
      jumbotronHeader = (
        <div>
          <h1>Welcome!</h1>
          <p>Please choose an option from below.</p>
        </div>
      );
    } else {
      jumbotronHeader = (
        <div>
          <p>Ready to {startButton}</p>
          <p>List name: {this.props.listName.trim()}</p>
          <p>Press Start to quiz, or one of the options below.</p>
        </div>
      );
    }
    return jumbotronHeader;
  }

  /**
   * Modals are not quite "rendered" in a specific location. This just
   * puts them in the DOM so they can be brought up with a button click.
   * @return {React.Component}
   */
  renderModals() {
    return (
      <div>
        <ChallengeResultsModal
          challengeData={this.props.challengeData}
        />
        <SolutionsModal
          questions={this.props.questions}
          numCorrect={this.props.numCorrect}
          totalWords={this.props.totalWords}
          height={this.props.height}
          markMissed={this.props.markMissed}
          showLexiconSymbols={this.props.showLexiconSymbols}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="jumbotron">
        {this.renderJumbotronHeader()}
        {this.renderTableManagementButtons()}
        {this.renderModals()}
      </div>
    );
  }
}

GameInactiveArea.propTypes = {
  questions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
  numCorrect: PropTypes.number.isRequired,
  totalWords: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  markMissed: PropTypes.func.isRequired,
  showLexiconSymbols: PropTypes.bool.isRequired,
  isChallenge: PropTypes.bool.isRequired,
  challengeData: PropTypes.shape({
    entries: PropTypes.array,
    maxScore: PropTypes.number,
  }).isRequired,
  numberOfRounds: PropTypes.number.isRequired,
  resetTableCreator: PropTypes.func.isRequired,
  tableCreatorModalSelector: PropTypes.string.isRequired,
  listName: PropTypes.string.isRequired,
  startCountdown: PropTypes.number.isRequired,
  startCountingDown: PropTypes.bool.isRequired,

  canStart: PropTypes.bool.isRequired,
  handleStart: PropTypes.func.isRequired,
  handleStartCountdown: PropTypes.func.isRequired,
  handleStartCountdownCancel: PropTypes.func.isRequired,
};

export default GameInactiveArea;

