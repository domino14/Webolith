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

import Styling from './style';

class WordwallsApp extends React.Component {
  setGuessBoxFocus() {
    this.guessBox.setFocus();
  }

  render() {
    return (
      <div>
        <div className="row">
          <div
            className="col-xs-6 col-sm-4 col-md-4 col-lg-4"
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
            className="col-xs-4 col-sm-3 col-md-2 col-lg-2"
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
        </div>

        <div className="row">
          <div className="col-xs-12 col-sm-9 col-md-9 col-lg-7">
            <GameArea
              numberOfRounds={this.props.numberOfRounds}
              isChallenge={this.props.isChallenge}
              curQuestions={this.props.curQuestions}
              origQuestions={this.props.origQuestions}
              displayStyle={this.props.displayStyle}
              totalWords={this.props.totalWords}
              answeredByMe={this.props.answeredByMe}
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
          <div className="hidden-xs col-sm-3 col-md-3 col-lg-2">
            <UserBox
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answers={this.props.answeredByMe}
              totalWords={this.props.totalWords}
              username={this.props.username}
            />
          </div>
        </div>
        <div className="row">
          <div
            className={`hidden-xs col-sm-offset-9 col-sm-3 col-md-offset-9
              col-md-3 col-lg-offset-7 col-lg-2`}
          >
            <Leaderboard
              showLexiconSymbols={
                !this.props.displayStyle.hideLexiconSymbols}
              answers={this.props.answeredByMe}
              totalWords={this.props.totalWords}
              username={`${this.props.username}foo`}
            />
          </div>
        </div>

        <div
          className="row"
          style={{
            marginTop: '4px',
          }}
        >
          <div className="col-xs-7 col-sm-5 col-md-5 col-lg-3">
            <GuessBox
              onGuessSubmit={this.props.onGuessSubmit}
              lastGuess={this.props.lastGuess}
              lastGuessCorrectness={this.props.lastGuessCorrectness}
              onHotKey={this.props.onHotKey}
              ref={gb => (this.guessBox = gb)}
            />
          </div>
          <div
            className="col-xs-5 col-sm-7 col-md-5 col-lg-5"
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
          <div className="col-xs-12 col-sm-10 col-md-9 col-lg-7">
            <ChatBox messages={this.props.tableMessages} />
          </div>
        </div>
        <div
          className="row visible-xs-block"
        >
          <div className="col-xs-6">
            <ReducedUserBox
              answeredByMe={this.props.answeredByMe}
              totalWords={this.props.totalWords}
              username={this.props.username}
            />
          </div>
        </div>
      </div>
    );
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
  curQuestions: React.PropTypes.instanceOf(Immutable.List),
  origQuestions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  totalWords: React.PropTypes.number,
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
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
};
export default WordwallsApp;

