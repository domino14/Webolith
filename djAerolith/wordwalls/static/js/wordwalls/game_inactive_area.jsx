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

class GameInactiveArea extends React.Component {
  constructor() {
    super();
    this.handleStartClick = this.handleStartClick.bind(this);
  }

  handleStartClick() {
    this.props.handleStart();
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
          buttonText="Back to Main Page"
        />
      </div>
    );
  }

  renderJumbotronHeader() {
    let jumbotronHeader = null;
    let challengeButton = null;
    const startButton = (
      <StartButton
        buttonText="Start"
        buttonClass="btn btn-primary btn-lg"
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
    if (this.props.numberOfRounds > 0) {
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
              buttonText="Show Solutions"
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

  handleStart: PropTypes.func.isRequired,
};

export default GameInactiveArea;

