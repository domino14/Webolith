/* global JSON, window, document */
/* eslint-disable new-cap, jsx-a11y/no-static-element-interactions */
import React from 'react';
import $ from 'jquery';
import _ from 'underscore';

import WordwallsGame from './wordwalls_game';
import ListSaveBar from './topbar/save_list';
import Preferences from './topbar/preferences';
import StartButton from './topbar/start_button';
import GameTimer from './topbar/game_timer';
import GameBoard from './gameboard';
import UserBox from './user_box';
import ReducedUserBox from './reduced_user_box';
import GuessBox from './bottombar/guessbox';
import ShuffleButtons from './topbar/shufflebuttons';
import ChatBox from './bottombar/chatbox';
import ChallengeResults from './challenge_results';

const game = new WordwallsGame();

class WordwallsApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gameGoing: false,
      initialGameTime: 0,
      // Contains the original questions.
      origQuestions: game.getOriginalQuestionState(),
      // Similar to origQuestions, but this list is what is directly
      // being rendered in the game board. Questions should be removed
      // from it as they are solved, and they can be shuffled around.
      curQuestions: game.getQuestionState(),
      messages: [],
      isChallenge: false,
      totalWords: 0,
      answeredByMe: [],
      lastGuess: '',
      challengeData: {},
      displayStyle: this.props.displayStyle,
      numberOfRounds: 0,
      listName: this.props.listName,
      autoSave: this.props.autoSave,

      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    };
    // Bindings:
    this.timerRanOut = this.timerRanOut.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleAlphagram = this.handleAlphagram.bind(this);
    this.handleAutoSaveToggle = this.handleAutoSaveToggle.bind(this);
    this.handleCustomOrder = this.handleCustomOrder.bind(this);
    this.handleGiveup = this.handleGiveup.bind(this);
    this.handleListNameChange = this.handleListNameChange.bind(this);
    this.handleShuffleAll = this.handleShuffleAll.bind(this);
    this.onGuessSubmit = this.onGuessSubmit.bind(this);
    this.onHotKey = this.onHotKey.bind(this);
    this.beforeUnload = this.beforeUnload.bind(this);
    this.setDisplayStyle = this.setDisplayStyle.bind(this);
    this.onShuffleQuestion = this.onShuffleQuestion.bind(this);
    this.markMissed = this.markMissed.bind(this);
  }

  componentDidMount() {
    // Set up beforeUnloadEventHandler here.
    window.onbeforeunload = this.beforeUnload;
    // Disallow backspace to go back to previous page.
    $(document).bind('keydown keypress', (e) => {
      if (e.which === 8) {
        // 8 == backspace
        if (e.target.tagName !== 'INPUT' || e.target.disabled ||
            e.target.readOnly) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener('resize', this.handleResize.bind(this));
    // Tooltip.
    $('.hovertip').tooltip({
      placement: 'bottom',
    });
  }

  onGuessSubmit(guess) {
    const modifiedGuess = this.maybeModifyGuess(guess);
    if (!this.state.gameGoing) {
      // Don't bother submitting guess if the game is over.
      return;
    }
    this.setState({
      lastGuess: guess,
    });
    if (!game.answerExists(modifiedGuess)) {
      // If the guess wasn't valid, don't bother submitting it to
      // the server.
      return;
    }
    $.ajax({
      url: this.props.tableUrl,
      method: 'POST',
      dataType: 'json',
      // That's a lot of guess
      data: {
        action: 'guess',
        guess: modifiedGuess,
      },
    })
    .done(this.handleGuessResponse.bind(this))
    .fail(this.handleGuessFailure.bind(this));
  }

  onHotKey(key) {
    // Hot key map.
    const fnMap = {
      1: this.handleShuffleAll,
      2: this.handleAlphagram,
      3: this.handleCustomOrder,
    };
    fnMap[key]();
  }

  onShuffleQuestion(idx) {
    game.shuffle(idx);
    this.setState({
      curQuestions: game.getQuestionState(),
    });
  }

  /**
   * Set the display style. (Yes, this is a useless comment)
   * @param {Object} style
   */
  setDisplayStyle(style) {
    this.setState({
      displayStyle: style,
    });
    // Also persist to the backend.
    $.ajax({
      url: '/wordwalls/api/configure/',
      method: 'POST',
      dataType: 'json',
      data: JSON.stringify(style),
    });
  }

  handleListNameChange(newListName) {
    this.setState({
      listName: newListName,
    });
  }

  handleAutoSaveToggle() {
    const newAutoSave = !this.state.autoSave;
    this.setState({
      autoSave: newAutoSave,
    });
    if (newAutoSave) {
      if (!this.state.gameGoing) {
        this.saveGame();
      }
      this.addServerMessage(`Autosave is now on! Aerolith will save your
        list progress to ${this.state.listName} at the end of every round.`);
    } else {
      this.addServerMessage('Autosave is off.', 'error');
    }
  }

  beforeUnload() {
    if (this.state.gameGoing) {
      $.ajax({
        url: this.props.tableUrl,
        async: false,
        data: {
          action: 'giveUpAndSave',
          // Fool the endpoint; if autosave is not on, don't actually
          // save with a listname.
          listname: this.state.autoSave ? this.state.listName : '',
        },
        method: 'POST',
      });
    }
  }

  handleStart() {
    $.ajax({
      url: this.props.tableUrl,
      method: 'POST',
      dataType: 'json',
      data: {
        action: 'start',
      },
    })
    .done(this.handleStartReceived.bind(this))
    .fail((jqXHR) => {
      this.addServerMessage(jqXHR.responseJSON.error, 'error');
      // XXX: This is a hack; use proper error codes.
      if (jqXHR.responseJSON.error.indexOf('currently running') !== -1) {
        this.setState({
          gameGoing: true,
        });
      }
    });
  }

  handleStartReceived(data) {
    if (this.state.gameGoing) {
      return;
    }
    if (_.has(data, 'serverMsg')) {
      this.addServerMessage(data.serverMsg);
    }
    if (_.has(data, 'questions')) {
      game.init(data.questions);
      this.setState({
        numberOfRounds: this.state.numberOfRounds + 1,
        origQuestions: game.getOriginalQuestionState(),
        curQuestions: game.getQuestionState(),
        answeredByMe: game.getAnsweredByMe(),
        totalWords: game.getTotalNumWords(),
      });
      this.guessBox.setFocus();
    }

    if (_.has(data, 'time')) {
      // Convert time to milliseconds.
      this.setState({
        initialGameTime: data.time * 1000,
        gameGoing: true,
      });
    }
    if (_.has(data, 'gameType')) {
      this.setState({
        isChallenge: data.gameType === 'challenge',
      });
    }
  }

  handleResize() {
    this.setState({
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
    });
  }

  /**
   * Called when the front-end timer runs out. Make a call to the
   * back-end to possibly end the game.
   */
  timerRanOut() {
    // Only send this if the game is going.
    if (!this.state.gameGoing) {
      return;
    }
    $.ajax({
      url: this.props.tableUrl,
      method: 'POST',
      data: {
        action: 'gameEnded',
      },
      dataType: 'json',
    })
    .done((data) => {
      if (_.has(data, 'g') && !data.g) {
        this.processGameEnded();
      }
    });
  }

  /**
   * Maybe modify the guess to replace spanish digraph tiles with their
   * proper code. Only if lexicon is Spanish.
   * @param  {string} guess
   * @return {string}
   */
  maybeModifyGuess(guess) {
    if (this.props.lexicon !== 'FISE09') {
      return guess;
    }
    // Replace.
    const newGuess = guess.replace(/CH/g, '1').replace(/LL/g, '2').replace(
      /RR/g, '3');
    return newGuess;
  }

  handleGuessResponse(data) {
    if (_.has(data, 'C')) {
      if (data.C !== '') {
        // data.C contains the alphagram.
        game.solve(data.w, data.C);
        this.setState({
          curQuestions: game.getQuestionState(),
          origQuestions: game.getOriginalQuestionState(),
          answeredByMe: game.getAnsweredByMe(),
        });
      }
    }
    if (_.has(data, 'g') && !data.g) {
      this.processGameEnded();
    }
  }

  handleGuessFailure(jqXHR) {
    if (jqXHR.status !== 400 && jqXHR.status !== 0) {
      // TODO: Log this error.
    }
    if (jqXHR.status === 0 && jqXHR.readyState === 0 &&
        jqXHR.statusText === 'error') {
      this.addServerMessage(
        'Error - please check your internet connection and try again.',
        'red');
    }
  }

  markMissed(alphaIdx, alphagram) {
    // Mark the alphagram missed.
    $.ajax({
      url: `${this.props.tableUrl}missed/`,
      method: 'POST',
      dataType: 'json',
      data: {
        idx: alphaIdx,
      },
    })
    .done((data) => {
      if (data.success === true) {
        game.miss(alphagram);
        this.setState({
          origQuestions: game.getOriginalQuestionState(),
        });
      }
    });
  }

  addServerMessage(serverMsg, optType) {
    const curMessages = this.state.messages;
    curMessages.push({
      author: '',
      id: _.uniqueId('msg_'),
      content: serverMsg,
      type: optType || 'server',
    });
    this.setState({
      messages: curMessages,
    });
  }

  processGameEnded() {
    this.setState({
      gameGoing: false,
    });
    if (this.state.autoSave) {
      this.saveGame();
    }
    if (this.state.numberOfRounds === 1 && this.state.isChallenge) {
      // XXX: Kind of ugly, breaks encapsulation.
      $.ajax({
        url: this.tableUrl,
        method: 'POST',
        data: {
          action: 'getDcData',
        },
        dataType: 'json',
      }).done((data) => {
        this.setState({
          challengeData: data,
        });
        $('.challenge-results-modal').modal();
      });
    }
  }

  /**
   * Save the game on the server.
   */
  saveGame() {
    if (this.state.listName === '') {
      this.addServerMessage('You must enter a list name for saving!',
        'error');
      return;
    }
    $.ajax({
      url: this.props.tableUrl,
      method: 'POST',
      data: {
        action: 'save',
        listname: this.state.listName,
      },
      dataType: 'json',
    })
    .done((data) => {
      if (data.success === true) {
        this.addServerMessage(`Saved as ${data.listname}`);
      }
      if (data.info) {
        this.addServerMessage(data.info);
      }
    });
  }

  /**
   * Handle the shuffling of tiles for display.
   * @param  {number?} which The index (or undefined for all).
   */
  handleShuffleAll() {
    game.shuffleAll();
    this.setState({
      curQuestions: game.getQuestionState(),
    });
    this.guessBox.setFocus();
  }

  handleAlphagram() {
    game.resetAllOrders();
    this.setState({
      curQuestions: game.getQuestionState(),
    });
    this.guessBox.setFocus();
  }

  handleCustomOrder() {
    if (!(this.state.displayStyle && this.state.displayStyle.tc)) {
      return;
    }
    game.setCustomLetterOrder(this.state.displayStyle.tc.customOrder);
    this.setState({
      curQuestions: game.getQuestionState(),
    });
    this.guessBox.setFocus();
  }

  handleGiveup() {
    $.ajax({
      url: this.props.tableUrl,
      method: 'POST',
      dataType: 'json',
      data: {
        action: 'giveUp',
      },
    })
    .done((data) => {
      if (_.has(data, 'g') && !data.g) {
        this.processGameEnded();
      }
    });
  }

  render() {
    // Calculate board width, height, grid dimensions from window
    // dimensions.
    // This is the size of a question in pixels. We should make these
    // dynamic later to allow users to zoom in, etc.
    const questionWidth = 180;
    const questionHeight = 30;
    let boardGridWidth;
    const boardGridHeight = 13;
    // Magic numbers; if we modify these we'll have to figure something out.
    if (this.state.windowWidth < 768) {
      // We take up 100%.
      boardGridWidth = Math.max(
        Math.floor(this.state.windowWidth / questionWidth), 1);
    } else if (this.state.windowWidth < 992) {
      // This gets tricky because the UserBox component gets in the way.
      boardGridWidth = 3;
    } else {
      boardGridWidth = 4;
    }

    const boardWidth = questionWidth * boardGridWidth;
    const boardHeight = questionHeight * boardGridHeight;
    game.setMaxOnScreenQuestions(boardGridWidth * boardGridHeight);

    return (
      <div>
        <div className="row">
          <div
            className="col-xs-6 col-sm-4 col-md-3 col-lg-3"
          >
            <ListSaveBar
              listName={this.state.listName}
              autoSave={this.state.autoSave}
              onListNameChange={this.handleListNameChange}
              onAutoSaveToggle={this.handleAutoSaveToggle}
            />
          </div>
          <div
            className="col-xs-1 col-sm-1 col-md-1 col-lg-1"
            style={{
              marginTop: '-4px',
            }}
          >
            <Preferences
              displayStyle={this.state.displayStyle}
              onSave={this.setDisplayStyle}
            />
          </div>
          <div
            className="col-xs-4 col-sm-3 col-md-2 col-lg-2"
            style={{ whiteSpace: 'nowrap' }}
          >
            <StartButton
              handleStart={this.handleStart}
              handleGiveup={this.handleGiveup}
              gameGoing={this.state.gameGoing}
            />
            <GameTimer
              initialGameTime={this.state.initialGameTime}
              completeCallback={this.timerRanOut}
              gameGoing={this.state.gameGoing}
            />
          </div>
          <div className="hidden-xs col-sm-2 col-md-1 col-lg-1">
            <button
              className="btn btn-danger btn-sm"
              style={{ marginTop: '-6px' /* why? */}}
              onClick={() => (window.location = '/wordwalls')}
            >Exit</button>
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 col-sm-9 col-md-9 col-lg-7">
            <GameBoard
              numberOfRounds={this.state.numberOfRounds}
              curQuestions={this.state.curQuestions}
              origQuestions={this.state.origQuestions}
              displayStyle={this.state.displayStyle}
              totalWords={this.state.totalWords}
              answeredByMe={this.state.answeredByMe}
              onShuffle={this.onShuffleQuestion}
              gameGoing={this.state.gameGoing}
              markMissed={this.markMissed}
              width={boardWidth}
              height={boardHeight}
              gridWidth={boardGridWidth}
              gridHeight={boardGridHeight}
            />
          </div>
          <div className="hidden-xs col-sm-3 col-md-3 col-lg-2">
            <UserBox
              showLexiconSymbols={
                !this.state.displayStyle.bc.hideLexiconSymbols}
              answeredByMe={this.state.answeredByMe}
              totalWords={this.state.totalWords}
              username={this.props.username}
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
              onGuessSubmit={this.onGuessSubmit}
              lastGuess={this.state.lastGuess}
              onHotKey={this.onHotKey}
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
              shuffle={this.handleShuffleAll}
              alphagram={this.handleAlphagram}
              customOrder={this.handleCustomOrder}
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: '4px' }}>
          <div className="col-xs-12 col-sm-10 col-md-9 col-lg-7">
            <ChatBox messages={this.state.messages} />
          </div>
        </div>
        <div
          className="row visible-xs-block"
        >
          <div className="col-xs-12">
            <ReducedUserBox
              answeredByMe={this.state.answeredByMe}
              totalWords={this.state.totalWords}
              username={this.props.username}
            />
          </div>
        </div>
        <ChallengeResults
          challengeData={this.state.challengeData}
        />
      </div>
    );
  }

}

WordwallsApp.propTypes = {
  username: React.PropTypes.string,
  listName: React.PropTypes.string,
  autoSave: React.PropTypes.bool,
  lexicon: React.PropTypes.string,
  displayStyle: React.PropTypes.shape({
    tc: React.PropTypes.object,
    bc: React.PropTypes.object,
  }),
  tableUrl: React.PropTypes.string,
};

export default WordwallsApp;
