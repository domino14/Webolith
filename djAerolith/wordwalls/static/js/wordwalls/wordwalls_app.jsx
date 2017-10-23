import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

import ListSaveBar from './topbar/save_list';
import SettingsCog from './topbar/settings_cog';
import GiveUpButton from './topbar/give_up_button';
import GameTimer from './topbar/game_timer';
import GameArea from './gamearea';
import UserBox from './user_box';
import Leaderboard from './leaderboard';
import ReducedUserBox from './reduced_user_box';
import GuessBox from './bottombar/guessbox';
import ShuffleButtons from './topbar/shufflebuttons';
import ChatBox from './bottombar/chatbox';
import ChatBar from './lobby/chat_bar';
import Players from './lobby/players';

import Styling from './style';

class WordwallsApp extends React.Component {
  constructor() {
    super();
    this.onGuessBoxBlur = this.onGuessBoxBlur.bind(this);
    this.onChatBarBlur = this.onChatBarBlur.bind(this);
  }

  onGuessBoxBlur() {
    this.chatBar.setFocus();
  }

  onChatBarBlur() {
    this.guessBox.setFocus();
  }

  setGuessBoxFocus() {
    this.guessBox.setFocus();
  }

  getNumCorrectAnswers() {
    return this.props.answeredBy.get(this.props.username, Immutable.List()).size;
  }

  renderTopNav() {
    return (
      <div className="row">
        <div
          className="col-xs-6 col-sm-5 col-md-5 col-lg-5"
        >
          <ListSaveBar
            listName={this.props.listName}
            autoSave={this.props.autoSave}
            onListNameChange={this.props.onListNameChange}
            onAutoSaveToggle={this.props.onAutoSaveToggle}
            disableEditing={this.props.tableIsMultiplayer}
          />
        </div>
        <div
          className="col-xs-1 col-sm-1 col-md-1 col-lg-1"
          style={{
            marginTop: '-4px',
          }}
        >
          <SettingsCog
            displayStyle={this.props.displayStyle}
            onSave={this.props.setDisplayStyle}
            isMultiplayer={this.props.tableIsMultiplayer}
          />
        </div>
        <div
          className="col-xs-4 col-sm-4 col-sm-offset-2 col-md-3
            col-md-offset-3 col-lg-2"
          style={{ whiteSpace: 'nowrap' }}
        >
          <GiveUpButton
            handleGiveup={this.props.handleGiveup}
            gameGoing={this.props.gameGoing}
          />
          <GameTimer
            initialGameTime={this.props.initialGameTime}
            completeCallback={this.props.timerRanOut}
            gameGoing={this.props.gameGoing}
          />
        </div>

      </div>);
  }

  renderLeftSide() {
    let chatBar;
    if (this.props.tableIsMultiplayer) {
      chatBar = (
        <div className="row">
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <ChatBar
              onChatSubmit={this.props.onChatSubmit}
              // onBlur={this.onChatBarBlur}
              ref={(cb) => {
                this.chatBar = cb;
              }}
            />
          </div>
        </div>);
    }

    return (
      <div>
        {this.renderTopNav()}
        <div className="row">
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <GameArea
              numberOfRounds={this.props.numberOfRounds}
              isChallenge={this.props.isChallenge}
              isBuild={this.props.isBuild}
              curQuestions={this.props.curQuestions}
              origQuestions={this.props.origQuestions}
              displayStyle={this.props.displayStyle}
              totalWords={this.props.totalWords}
              numCorrect={this.getNumCorrectAnswers()}
              onShuffle={this.props.onShuffleQuestion}
              gameGoing={this.props.gameGoing}
              markMissed={this.props.markMissed}
              width={this.props.boardWidth}
              height={this.props.boardHeight}
              gridWidth={this.props.boardGridWidth}
              gridHeight={this.props.boardGridHeight}
              challengeData={this.props.challengeData}
              resetTableCreator={this.props.resetTableCreator}
              tableCreatorModalSelector={this.props.tableCreatorModalSelector}
              listName={this.props.listName}
              answerers={this.props.answeredBy}
              startCountdown={this.props.startCountdown}
              startCountingDown={this.props.startCountingDown}

              canStart={this.props.currentHost === this.props.username}
              handleStart={this.props.handleStart}
              handleStartCountdown={this.props.handleStartCountdown}
              handleStartCountdownCancel={this.props.handleStartCountdownCancel}
            />
          </div>
        </div>

        <div
          className="row"
          style={{
            marginTop: '4px',
          }}
        >
          <div className="col-xs-7 col-sm-6 col-md-6 col-lg-5">
            <GuessBox
              onGuessSubmit={this.props.onGuessSubmit}
              lastGuess={this.props.lastGuess}
              lastGuessCorrectness={this.props.lastGuessCorrectness}
              onHotKey={this.props.onHotKey}
              // onBlur={this.onGuessBoxBlur}
              ref={(gb) => {
                this.guessBox = gb;
              }}
            />
          </div>
          <div
            className="col-xs-5 col-sm-6 col-md-6 col-lg-7"
            style={{
              marginTop: '-3px',
            }}
          >
            <ShuffleButtons
              shuffle={this.props.handleShuffleAll}
              alphagram={this.props.handleAlphagram}
              customOrder={this.props.handleCustomOrder}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: '4px' }}>
          <div className="col-xs-8 col-sm-9 col-md-9 col-lg-9">
            <ChatBox messages={this.props.tableMessages} />
          </div>
          <div className="col-xs-4 col-sm-3 col-md-3 col-lg-3">
            <Players
              players={this.props.usersInTable}
              height={100}
              currentHost={this.props.currentHost}
            />
          </div>
        </div>

        {chatBar}

      </div>
    );
  }

  renderRightSide() {
    let leaderboard;
    if (this.props.tableIsMultiplayer) {
      leaderboard = (
        <div className="row">
          <div className="col-sm-12 col-md-12 col-lg-12">
            <Leaderboard
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answerers={this.props.answeredBy}
            />
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="row">
          <div className="col-sm-12 col-md-12 col-lg-12">
            <UserBox
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answers={this.props.answeredBy.get(
this.props.username,
                Immutable.List(),
)}
              totalWords={this.props.totalWords}
              username={this.props.username}
              isBuild={this.props.isBuild}
            />
          </div>
        </div>

        {leaderboard}

      </div>);
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-xs-12 col-sm-9 col-md-9 col-lg-7">
            {this.renderLeftSide()}
          </div>
          <div className="hidden-xs col-sm-3 col-md-3 col-lg-2">
            {this.renderRightSide()}
          </div>
        </div>

        <div className="row visible-xs-block">
          <div className="col-xs-12">
            <ReducedUserBox
              numCorrect={this.getNumCorrectAnswers()}
              totalWords={this.props.totalWords}
              username={this.props.username}
              isBuild={this.props.isBuild}
            />
          </div>
        </div>

      </div>);
  }
}

WordwallsApp.defaultProps = {
  listName: '',
  autoSave: false,
};

WordwallsApp.propTypes = {
  listName: PropTypes.string,
  autoSave: PropTypes.bool,
  onListNameChange: PropTypes.func.isRequired,
  onAutoSaveToggle: PropTypes.func.isRequired,

  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  setDisplayStyle: PropTypes.func.isRequired,

  handleStart: PropTypes.func.isRequired,
  handleGiveup: PropTypes.func.isRequired,
  handleStartCountdown: PropTypes.func.isRequired,
  handleStartCountdownCancel: PropTypes.func.isRequired,
  gameGoing: PropTypes.bool.isRequired,

  initialGameTime: PropTypes.number.isRequired,
  timerRanOut: PropTypes.func.isRequired,

  startCountdown: PropTypes.number.isRequired,
  startCountingDown: PropTypes.bool.isRequired,

  numberOfRounds: PropTypes.number.isRequired,
  isChallenge: PropTypes.bool.isRequired,
  isBuild: PropTypes.bool.isRequired,
  curQuestions: PropTypes.instanceOf(Immutable.List).isRequired,
  origQuestions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
  totalWords: PropTypes.number.isRequired,
  answeredBy: PropTypes.instanceOf(Immutable.Map).isRequired,
  onShuffleQuestion: PropTypes.func.isRequired,
  markMissed: PropTypes.func.isRequired,

  boardWidth: PropTypes.number.isRequired,
  boardHeight: PropTypes.number.isRequired,
  boardGridWidth: PropTypes.number.isRequired,
  boardGridHeight: PropTypes.number.isRequired,
  challengeData: PropTypes.shape({
    entries: PropTypes.array,
    maxScore: PropTypes.number,
  }).isRequired,
  resetTableCreator: PropTypes.func.isRequired,
  tableCreatorModalSelector: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  usersInTable: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentHost: PropTypes.string.isRequired,
  onGuessSubmit: PropTypes.func.isRequired,
  lastGuess: PropTypes.string.isRequired,
  lastGuessCorrectness: PropTypes.bool.isRequired,
  onHotKey: PropTypes.func.isRequired,
  tableIsMultiplayer: PropTypes.bool.isRequired,

  handleShuffleAll: PropTypes.func.isRequired,
  handleAlphagram: PropTypes.func.isRequired,
  handleCustomOrder: PropTypes.func.isRequired,
  tableMessages: PropTypes.arrayOf(PropTypes.shape({
    author: PropTypes.string,
    id: PropTypes.string,
    content: PropTypes.string,
    type: PropTypes.string,
  })).isRequired,
  onChatSubmit: PropTypes.func.isRequired,
};
export default WordwallsApp;

