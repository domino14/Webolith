import React from 'react';
import Immutable from 'immutable';

import ListSaveBar from './topbar/save_list';
import Preferences from './topbar/preferences';
import StartButton from './topbar/start_button';
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
    console.log('Blur guessBox, set focus on chatbar');

    this.chatBar.setFocus();
  }

  onChatBarBlur() {
    console.log('Blur chatbar, set focus on guessbox');
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
          />
        </div>
        <div
          className="col-xs-1 col-sm-1 col-md-1 col-lg-1"
          style={{
            marginTop: '-4px',
          }}
        >
          <Preferences
            displayStyle={this.props.displayStyle}
            onSave={this.props.setDisplayStyle}
          />
        </div>
        <div
          className={`col-xs-4 col-sm-4 col-sm-offset-2 col-md-3
            col-md-offset-3 col-lg-2`}
          style={{ whiteSpace: 'nowrap' }}
        >
          <StartButton
            handleStart={this.props.handleStart}
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
              ref={gb => (this.guessBox = gb)}
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
          <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
            <ChatBar
              onChatSubmit={this.props.onChatSubmit}
              // onBlur={this.onChatBarBlur}
              ref={cb => (this.chatBar = cb)}
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
            />
          </div>
        </div>

      </div>
    );
  }

  renderRightSide() {
    return (
      <div>
        <div className="row">
          <div className="col-sm-12 col-md-12 col-lg-12">
            <UserBox
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answers={this.props.answeredBy.get(this.props.username,
                Immutable.List())}
              totalWords={this.props.totalWords}
              username={this.props.username}
              isBuild={this.props.isBuild}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 col-md-12 col-lg-12">
            <Leaderboard
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answerers={this.props.answeredBy}
            />
          </div>
        </div>

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

WordwallsApp.propTypes = {
  listName: React.PropTypes.string,
  autoSave: React.PropTypes.bool,
  onListNameChange: React.PropTypes.func,
  onAutoSaveToggle: React.PropTypes.func,

  displayStyle: React.PropTypes.instanceOf(Styling),
  setDisplayStyle: React.PropTypes.func,

  handleStart: React.PropTypes.func,
  handleGiveup: React.PropTypes.func,
  gameGoing: React.PropTypes.bool,

  initialGameTime: React.PropTypes.number,
  timerRanOut: React.PropTypes.func,

  numberOfRounds: React.PropTypes.number,
  isChallenge: React.PropTypes.bool,
  isBuild: React.PropTypes.bool,
  curQuestions: React.PropTypes.instanceOf(Immutable.List),
  origQuestions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  totalWords: React.PropTypes.number,
  answeredBy: React.PropTypes.instanceOf(Immutable.Map),
  onShuffleQuestion: React.PropTypes.func,
  markMissed: React.PropTypes.func,

  boardWidth: React.PropTypes.number,
  boardHeight: React.PropTypes.number,
  boardGridWidth: React.PropTypes.number,
  boardGridHeight: React.PropTypes.number,
  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
  resetTableCreator: React.PropTypes.func,
  tableCreatorModalSelector: React.PropTypes.string,
  username: React.PropTypes.string,
  usersInTable: React.PropTypes.arrayOf(React.PropTypes.string),
  onGuessSubmit: React.PropTypes.func,
  lastGuess: React.PropTypes.string,
  lastGuessCorrectness: React.PropTypes.bool,
  onHotKey: React.PropTypes.func,

  handleShuffleAll: React.PropTypes.func,
  handleAlphagram: React.PropTypes.func,
  handleCustomOrder: React.PropTypes.func,
  tableMessages: React.PropTypes.arrayOf(React.PropTypes.shape({
    author: React.PropTypes.string,
    id: React.PropTypes.string,
    content: React.PropTypes.string,
    type: React.PropTypes.string,
  })),
  onChatSubmit: React.PropTypes.func,
};
export default WordwallsApp;

