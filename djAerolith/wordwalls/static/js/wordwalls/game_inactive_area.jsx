/**
 * @fileOverview A hero unit for when game is inactive, that will allow the
 * user to select what to do.
 */

import React from 'react';
import Immutable from 'immutable';

import SolutionsModal from './solutions_modal';
import ChallengeResultsModal from './challenge_results_modal';


const HeroButton = props => (
  <div className="col-md-6 col-sm-12" style={{ marginTop: 6 }}>
    <button
      className={`btn btn-lg ${props.addlButtonClass}`}
      role="button"
      onClick={props.onClick} // () => $(props.modalSelector).modal()}
      data-toggle="modal"
      data-target={props.modalSelector}
    >{props.buttonText}</button>
  </div>
);

HeroButton.propTypes = {
  addlButtonClass: React.PropTypes.string,
  modalSelector: React.PropTypes.string,
  buttonText: React.PropTypes.string,
  onClick: React.PropTypes.func,
};


class GameInactiveArea extends React.Component {
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
          onClick={() => (window.location.href = '/')}
          buttonText="Back to main page"
        />
      </div>
    );
  }

  renderJumbotronHeader() {
    let jumbotronHeader = null;
    let challengeButton = null;

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
        </div>
      );
    } else if (this.props.numberOfRounds > 0) {
      jumbotronHeader = (
        <div>
          <h1>Game over!</h1>
          <p>You can continue by clicking Start again, or view solutions / results
          below.</p>
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
          <h1>Ready to Start</h1>
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
  questions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  numCorrect: React.PropTypes.number,
  totalWords: React.PropTypes.number,
  height: React.PropTypes.number,
  markMissed: React.PropTypes.func,
  showLexiconSymbols: React.PropTypes.bool,
  isChallenge: React.PropTypes.bool,
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
  numberOfRounds: React.PropTypes.number,
  resetTableCreator: React.PropTypes.func,
  tableCreatorModalSelector: React.PropTypes.string,
  listName: React.PropTypes.string,
  startCountdown: React.PropTypes.number,
  startCountingDown: React.PropTypes.bool,
};

export default GameInactiveArea;

