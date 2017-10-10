/**
 * @fileOverview The container for the wordwalls_app. This container
 * should have all state, ajax, etc instead and wordwalls_app should
 * be as dumb as possible.
 */
/* global JSON, window, document */
/* eslint-disable new-cap, jsx-a11y/no-static-element-interactions */
import React from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';
import _ from 'underscore';
import Immutable from 'immutable';
import { WebSocketBridge } from 'django-channels';

import backgroundURL from './background';
import Styling from './style';
import WordwallsGame from './wordwalls_game';
import Presence from './presence';
import WordwallsApp from './wordwalls_app';
import Spinner from './spinner';
import TableCreator from './newtable/table_creator';

const game = new WordwallsGame();
const presence = new Presence();

const PRESENCE_TIMEOUT = 20000; // 20 seconds.
const GET_TABLES_INIT_TIMEOUT = 1500;
const FAKE_SECOND = 950;

class WordwallsAppContainer extends React.Component {
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
      messages: presence.getMessages(),
      users: presence.getUsers(),
      tables: presence.getTables(),
      isChallenge: false,
      isBuild: false,
      totalWords: 0,
      answeredBy: game.getAnsweredBy(),
      lastGuess: '',
      lastGuessCorrectness: false,
      challengeData: {},
      displayStyle: this.props.displayStyle,
      numberOfRounds: 0,
      listName: this.props.listName,
      autoSave: this.props.autoSave,
      loadingData: false,
      tablenum: this.props.tablenum,
      currentHost: this.props.currentHost,
      tableIsMultiplayer: this.props.tableIsMultiplayer,

      startCountingDown: false,
      startCountdown: 0,
      startCountdownTimer: null,

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
    this.onChatSubmit = this.onChatSubmit.bind(this);
    this.onHotKey = this.onHotKey.bind(this);
    this.beforeUnload = this.beforeUnload.bind(this);
    this.setDisplayStyle = this.setDisplayStyle.bind(this);
    this.onShuffleQuestion = this.onShuffleQuestion.bind(this);
    this.markMissed = this.markMissed.bind(this);
    this.handleLoadNewList = this.handleLoadNewList.bind(this);
    this.resetTableCreator = this.resetTableCreator.bind(this);
    this.handleGuessResponse = this.handleGuessResponse.bind(this);
    this.handleSocketMessages = this.handleSocketMessages.bind(this);
    this.sendPresence = this.sendPresence.bind(this);
    this.handleTables = this.handleTables.bind(this);
    this.handleStartCountdown = this.handleStartCountdown.bind(this);
    this.handleStartCountdownCancel = this.handleStartCountdownCancel.bind(this);
    this.countdownTimeout = this.countdownTimeout.bind(this);

    this.websocketBridge = new WebSocketBridge();
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

    $('body').css({
      'background-image': backgroundURL(this.props.displayStyle.bodyBackground),
    });

    // Finally, show table creation modal if tablenum is 0. This whole
    // thing is a bit of an anti-pattern because of our modals/Bootstrap/etc
    // Maybe there's a better way to hide/show modals using more React
    // idioms.
    if (this.state.tablenum === 0) {
      this.myTableCreator.showModal();
      this.myTableCreator.resetDialog();
    }

    this.connectToSocket();
    // Start presence timer.
    window.setInterval(this.sendPresence, PRESENCE_TIMEOUT);
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
      this.setState({
        lastGuessCorrectness: false,
      });
      return;
    }

    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'guess',
      contents: {
        guess,
      },
    });
  }

  onChatSubmit(chat, channel) {
    if (chat[0] === '/') {
      // Command
      const command = chat.substring(1);
      switch (command) {
        case 'getTables':
          this.getTables();
          break;
        default:
          break;
      }
      return;
    }
    this.websocketBridge.send({
      room: channel,
      type: 'chat',
      contents: {
        chat,
      },
    });
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
   * Set the current display style, and persist to backend.
   * @param {Styling} style
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
      contentType: 'application/json; charset=utf-8',
    });
    $('body').css({
      'background-image': backgroundURL(style.bodyBackground),
    });
  }

  getTables() {
    this.websocketBridge.send({
      type: 'getTables',
      room: 'lobby',
      contents: {},
    });
  }

  connectToSocket() {
    const url = `${this.props.socketServer}/wordwalls-socket`;
    this.websocketBridge.connect(url);
    this.websocketBridge.listen(this.handleSocketMessages);
    this.websocketBridge.socket.addEventListener('open', () => {
      if (this.state.tablenum !== 0) {
        this.sendSocketJoin(this.state.tablenum);
      }
      this.sendPresence();
      // Avoid a race condition; get tables at beginning after a short break.
      window.setTimeout(() => this.getTables(), GET_TABLES_INIT_TIMEOUT);
    });
  }

  handleListNameChange(newListName) {
    this.setState({
      listName: newListName,
    });
  }

  handleSocketMessages(message) {
    switch (message.type) {
      case 'server':
        this.addMessage(message.contents.error);
        break;
      case 'guessResponse':
        this.handleGuessResponse(message.contents);
        break;
      case 'chat':
        this.handleChat(message.contents);
        break;
      case 'presence':
        this.handleUsersIn(message.contents);
        break;
      case 'tableList':
        this.handleTables(message.contents);
        break;
      case 'tableUpdate':
        this.handleTable(message.contents);
        break;
      case 'gamePayload':
        this.handleStartReceived(message.contents);
        break;
      case 'gameGoingPayload':
        this.handleGameGoingPayload(message.contents);
        break;
      case 'gameOver':
        this.processGameEnded();
        break;
      case 'newHost':
        this.handleNewHost(message.contents);
        break;
      case 'startCountdown':
        this.handleStartCountdownFromServer(message.contents);
        break;
      case 'startCountdownCancel':
        this.handleStartCountdownCancelFromServer();
        break;
      case 'allSolve':
        this.handleAllSolve();
        break;
      case 'solveWord':
        this.handleSolveWord(message.contents);
        break;
      default:
        window.console.log('Received unrecognized message type:', message.type);
    }
  }

  /**
   * NOTE: used for debugging/testing.
   */
  handleAllSolve() {
    const answers = game.getRemainingAnswers();
    answers.forEach((answer, idx) => {
      window.setTimeout(() => {
        this.websocketBridge.send({
          room: String(this.state.tablenum),
          type: 'guess',
          contents: {
            guess: answer,
          },
        });
      }, (idx * 30));
    });
  }
  /**
   * NOTE: used for debugging/testing
   * @param  {Object} contents
   */
  handleSolveWord(contents) {
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'guess',
      contents: {
        guess: contents.word,
      },
    });
  }

  handleUsersIn(contents) {
    // The presence payload always gets sent to everyone currently online.
    // This provides a convenient way for the front end to update presence
    // lists inside tables, in the lobby, and on the table displayer thing.
    // This might not be scalable as we get more users.
    presence.addUsers(contents.users, contents.room);
    const newState = {
      users: presence.getUsers(),
      tables: presence.getTables(),
    };
    const currentHost = presence.getHost(String(this.state.tablenum));
    if (currentHost) {
      newState.currentHost = currentHost;
    }
    this.setState(newState);
  }

  handleNewHost(contents) {
    presence.setHost(contents.host, contents.room);
    this.setState({
      tables: presence.getTables(),
    });
    if (contents.room === String(this.state.tablenum)) {
      this.addMessage(`The host of this table is now ${contents.host}`, 'info');
      this.setState({
        currentHost: contents.host,
      });
    }
  }

  handleAutoSaveToggle() {
    const newAutoSave = !this.state.autoSave;
    if (newAutoSave && !this.state.listName) {
      return; // There is no list name, don't toggle the checkbox.
    }
    this.setState({
      autoSave: newAutoSave,
    });
    if (newAutoSave && !this.state.gameGoing) {
      this.saveGame();
    }
    this.showAutosaveMessage(newAutoSave);
  }

  showAutosaveMessage(autosave) {
    if (autosave) {
      this.addMessage(
        `Autosave is now on! Aerolith will save your
        list progress to ${this.state.listName} at the end of every round.`,
        'info',
      );
    } else {
      this.addMessage('Autosave is off.', 'error');
    }
  }

  beforeUnload() {
    if (this.state.gameGoing) {
      $.ajax({
        url: this.tableUrl(),
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
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'start',
      contents: {},
    });
  }

  handleStartCountdown(countdownSec) {
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'startCountdown',
      contents: {
        countdown: countdownSec,
      },
    });
  }

  handleStartCountdownCancel() {
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'startCountdownCancel',
      contents: {},
    });
  }

  handleGameGoingPayload(data) {
    this.handleStartReceived(data);
    if (_.has(data, 'time')) {
      this.addMessage(`This round will be over in ${Math.round(data.time)} seconds.
        Please wait to join the next round.`, 'info');
    }
  }

  handleStartReceived(data) {
    if (this.state.gameGoing) {
      return;
    }
    if (_.has(data, 'serverMsg')) {
      this.addMessage(data.serverMsg);
    }
    if (_.has(data, 'questions')) {
      game.init(data.questions);
      this.setState({
        numberOfRounds: this.state.numberOfRounds + 1,
        origQuestions: game.getOriginalQuestionState(),
        curQuestions: game.getQuestionState(),
        answeredBy: game.getAnsweredBy(),
        totalWords: game.getTotalNumWords(),
      });
      this.wwApp.setGuessBoxFocus();
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
        isChallenge: data.gameType.includes('challenge'),
        isBuild: data.gameType.includes('build'),
      });
    }
  }

  handleResize() {
    this.setState({
      windowWidth: window.innerWidth,
    });
  }

  countdownTimeout() {
    const newCountdown = this.state.startCountdown - 1;
    this.setState({
      startCountdown: newCountdown,
    });
    if (newCountdown >= 0) {
      this.setState({
        startCountdownTimer: window.setTimeout(
          this.countdownTimeout,
          FAKE_SECOND,
        ),
      });
    } else {
      this.setState({
        startCountingDown: false,
      });
    }
  }

  handleStartCountdownFromServer(contents) {
    this.setState({
      startCountingDown: true,
      startCountdown: contents,
      // Account for ping delay. XXX: This is ugly...
      startCountdownTimer: window.setTimeout(
        this.countdownTimeout,
        FAKE_SECOND,
      ),
    });
  }

  handleStartCountdownCancelFromServer() {
    window.clearInterval(this.state.startCountdownTimer);
    this.setState({
      startCountingDown: false,
      startCountdown: 0,
      startCountdownTimer: null,
    });
    this.addMessage('The start of the game was canceled!', 'error');
  }

  sendPresence() {
    this.websocketBridge.send({
      type: 'presence',
    });
  }

  /**
   * Called when the front-end timer runs out. Make a call to the
   * back-end to possibly end the game.
   */
  timerRanOut() {
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'timerEnded',
      contents: {},
    });
  }

  /**
   * Compute the tableUrl based on the optional table number, or the
   * table number in the state.
   * @param  {number?} optTablenum
   * @return {string}
   */
  tableUrl(optTablenum) {
    let { tablenum } = this.state;
    if (optTablenum) {
      tablenum = optTablenum;
    }
    return `/wordwalls/table/${tablenum}/`;
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
    const newGuess = guess.replace(/CH/g, '1').replace(/LL/g, '2').replace(/RR/g, '3');
    return newGuess;
  }

  handleGuessResponse(data) {
    if (_.has(data, 'C')) {
      if (data.C !== '') {
        // data.C contains the alphagram.
        const solved = game.solve(data.w, data.C, data.s);
        if (!solved) {
          return;
        }
        if (this.state.tableIsMultiplayer) {
          this.addMessage(`${data.s} solved ${data.w}`, 'info');
        }
        this.setState({
          curQuestions: game.getQuestionState(),
          origQuestions: game.getOriginalQuestionState(),
          answeredBy: game.getAnsweredBy(),
          lastGuessCorrectness: (data.s === this.props.username ? true :
            this.state.lastGuessCorrectness),
        });
      }
    }
  }

  handleChat(data) {
    this.addMessage(data.chat, 'chat', data.sender, data.room === 'lobby');
  }

  handleTables(data) {
    presence.addTables(data.tables);
    this.setState({
      tables: presence.getTables(),
      currentHost: presence.getHost(String(this.state.tablenum)),
    });
  }

  handleTable(data) {
    presence.updateTable(data.table);
    this.setState({
      tables: presence.getTables(),
    });
    if (data.table.tablenum !== this.state.tablenum) {
      return;
    }
    // If here, this is the table we are currently in; let's make some
    // visual updates.
    const oldList = this.state.listName;
    const host = presence.getHost(String(this.state.tablenum));
    const oldHost = this.state.currentHost;
    if (oldHost !== host) {
      // Host change?
      this.setState({
        currentHost: host,
      });
    }
    if (oldList !== data.table.wordList) {
      this.setState({
        listName: data.table.wordList,
      });
      if (host !== this.props.username) {
        this.addMessage(`${host} changed the word list to ${data.table.lexicon}
         - ${data.table.wordList}`, 'info');
      }
    }
  }

  markMissed(alphaIdx, alphagram) {
    // Mark the alphagram missed.
    $.ajax({
      url: `${this.tableUrl()}missed/`,
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

  addMessage(serverMsg, optType, optSender, optIsLobby) {
    const message = {
      author: optSender || '',
      id: _.uniqueId('msg_'),
      content: serverMsg,
      type: optType || 'server',
    };

    presence.addMessage(message, optIsLobby);
    this.setState({
      messages: presence.getMessages(),
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
        url: this.tableUrl(),
        method: 'POST',
        data: {
          action: 'getDcData',
        },
        dataType: 'json',
      }).done((data) => {
        this.setState({
          challengeData: data,
        });
      });
    }
  }

  /**
   * Save the game on the server.
   */
  saveGame() {
    if (this.state.listName === '') {
      this.addMessage('You must enter a list name for saving!', 'error');
      return;
    }
    $.ajax({
      url: this.tableUrl(),
      method: 'POST',
      data: {
        action: 'save',
        listname: this.state.listName,
      },
      dataType: 'json',
    })
      .done((data) => {
        if (data.success === true) {
          this.addMessage(`Saved as ${data.listname}`, 'info');
        }
        if (data.info) {
          this.addMessage(data.info);
        }
      })
      .fail(jqXHR => this.addMessage(`Error saving: ${jqXHR.responseJSON.error}`, 'error'));
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
    this.wwApp.setGuessBoxFocus();
  }

  handleAlphagram() {
    game.resetAllOrders();
    this.setState({
      curQuestions: game.getQuestionState(),
    });
    this.wwApp.setGuessBoxFocus();
  }

  handleCustomOrder() {
    game.setCustomLetterOrder(this.state.displayStyle.customTileOrder);
    this.setState({
      curQuestions: game.getQuestionState(),
    });
    this.wwApp.setGuessBoxFocus();
  }

  handleGiveup() {
    this.websocketBridge.send({
      room: String(this.state.tablenum),
      type: 'giveup',
      contents: {},
    });
  }

  /**
   * Handle the loading of a new list into a table. This only gets triggered
   * when the user loads a new list, and not when the user clicks join on a
   * table. XXX: This may be a code smell, why use parallel paths?
   * @param  {Object} data
   */
  handleLoadNewList(data) {
    let changeUrl = false;
    const oldTablenum = this.state.tablenum;
    // let useReplaceState = false;
    if (data.tablenum !== oldTablenum) {
      changeUrl = true;
      // if (this.state.tablenum !== 0) {
      //   useReplaceState = true; // Replace instead of push if we already have
      //                           // a table num. This will probably come in use
      //                           // for multiplayer mode. This prevents the user
      //                           // from having to click back hella times.
      // }
    }
    this.setState({
      listName: data.list_name,
      autoSave: data.autosave && !data.multiplayer,
      tablenum: data.tablenum,
      numberOfRounds: 0,
      curQuestions: Immutable.List(),
      tableIsMultiplayer: data.multiplayer,
    });
    this.addMessage(`Loaded new list: ${data.list_name}`, 'info');
    this.showAutosaveMessage(data.autosave && !data.multiplayer);
    if (changeUrl) {
      // The .bind(history) is important because otherwise `this` changes
      // and we get an "illegal invocation". 😒
      // let stateChanger = history.pushState.bind(history);
      // if (useReplaceState) {
      //   stateChanger = history.replaceState.bind(history);
      // }
      window.history.replaceState(
        {}, `Table ${data.tablenum}`,
        this.tableUrl(data.tablenum),
      );
      document.title = `Wordwalls - table ${data.tablenum}`;
      if (oldTablenum !== 0) {
        this.sendSocketTableReplace(oldTablenum, data.tablenum);
      } else {
        this.sendSocketJoin(data.tablenum);
      }
    }
  }

  sendSocketJoin(tablenum) {
    this.websocketBridge.send({
      room: String(tablenum),
      type: 'join',
      contents: {},
    });
  }

  sendSocketTableReplace(oldTablenum, tablenum) {
    this.websocketBridge.send({
      room: String(tablenum),
      type: 'replaceTable',
      contents: {
        oldTable: oldTablenum,
      },
    });
  }

  resetTableCreator() {
    this.myTableCreator.resetDialog();
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
      boardGridWidth = Math.max(Math.floor(this.state.windowWidth / questionWidth), 1);
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
        <Spinner
          visible={this.state.loadingData}
        />
        <TableCreator
          // Normally this is invisible. It is shown by the
          // new-button modal or other conditions (route).
          ref={(ref) => {
            this.myTableCreator = ref;
          }}
          defaultLexicon={this.props.defaultLexicon}
          availableLexica={this.props.availableLexica}
          challengeInfo={this.props.challengeInfo}
          tablenum={this.state.tablenum}
          currentHost={this.state.currentHost}
          onLoadNewList={this.handleLoadNewList}
          gameGoing={this.state.gameGoing}
          setLoadingData={loading => this.setState({ loadingData: loading })}
          username={this.props.username}
          onChatSubmit={chat => this.onChatSubmit(chat, 'lobby')}
          messages={this.state.messages.get('lobby', Immutable.List()).toJS()}
          users={this.state.users.get('lobby', Immutable.List()).toJS()}
          tables={this.state.tables.toJS()}
          tableIsMultiplayer={this.state.tableIsMultiplayer}
        />
        <WordwallsApp
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          boardGridWidth={boardGridWidth}
          boardGridHeight={boardGridHeight}

          listName={this.state.listName}
          autoSave={this.state.autoSave}
          onListNameChange={this.handleListNameChange}
          onAutoSaveToggle={this.handleAutoSaveToggle}

          displayStyle={this.state.displayStyle}
          setDisplayStyle={this.setDisplayStyle}

          handleStart={this.handleStart}
          handleGiveup={this.handleGiveup}
          gameGoing={this.state.gameGoing}

          initialGameTime={this.state.initialGameTime}
          timerRanOut={this.timerRanOut}

          numberOfRounds={this.state.numberOfRounds}
          isChallenge={this.state.isChallenge}
          isBuild={this.state.isBuild}
          curQuestions={this.state.curQuestions}
          origQuestions={this.state.origQuestions}
          totalWords={this.state.totalWords}
          answeredBy={this.state.answeredBy}
          onShuffleQuestion={this.onShuffleQuestion}
          markMissed={this.markMissed}
          challengeData={this.state.challengeData}
          resetTableCreator={this.resetTableCreator}
          tableCreatorModalSelector=".table-modal"
          username={this.props.username}
          currentHost={this.state.currentHost}

          onGuessSubmit={this.onGuessSubmit}
          lastGuess={this.state.lastGuess}
          lastGuessCorrectness={this.state.lastGuessCorrectness}
          onHotKey={this.onHotKey}

          handleShuffleAll={this.handleShuffleAll}
          handleAlphagram={this.handleAlphagram}
          handleCustomOrder={this.handleCustomOrder}
          tableMessages={this.state.messages.get('table', Immutable.List()).toJS()}
          onChatSubmit={chat => this.onChatSubmit(chat, String(this.state.tablenum))}
          usersInTable={this.state.users.get(String(this.state.tablenum), Immutable.List()).toJS()}

          startCountdown={this.state.startCountdown}
          startCountingDown={this.state.startCountingDown}
          handleStartCountdown={this.handleStartCountdown}
          handleStartCountdownCancel={this.handleStartCountdownCancel}

          tableIsMultiplayer={this.state.tableIsMultiplayer}
          ref={(wwApp) => {
            this.wwApp = wwApp;
          }}
        />
      </div>
    );
  }
}

WordwallsAppContainer.propTypes = {
  username: PropTypes.string.isRequired,
  listName: PropTypes.string.isRequired,
  autoSave: PropTypes.bool.isRequired,
  lexicon: PropTypes.string.isRequired,
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  tablenum: PropTypes.number.isRequired,
  tableIsMultiplayer: PropTypes.bool.isRequired,
  currentHost: PropTypes.string.isRequired,
  defaultLexicon: PropTypes.number.isRequired,
  challengeInfo: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    questions: PropTypes.number,
    seconds: PropTypes.number,
  })).isRequired,
  availableLexica: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number,
    lexicon: PropTypes.string,
    description: PropTypes.string,
    counts: PropTypes.object,
  })).isRequired,
  socketServer: PropTypes.string.isRequired,
};

export default WordwallsAppContainer;
