/**
 * @fileOverview The container for the wordwalls_app. This container
 * should have all state, ajax, etc instead and wordwalls_app should
 * be as dumb as possible.
 */
/* global JSON, window, document */
/* eslint-disable new-cap, jsx-a11y/no-static-element-interactions */
import React from 'react';
import $ from 'jquery';
import _ from 'underscore';
import Immutable from 'immutable';
import { WebSocketBridge } from 'django-channels';

import backgroundURL from './background';
import Styling from './style';
import WordwallsGame from './wordwalls_game';
import WordwallsApp from './wordwalls_app';
import Spinner from './spinner';
import TableCreator from './newtable/table_creator';

const game = new WordwallsGame();
const MAX_MESSAGES = 200;
const PRESENCE_TIMEOUT = 20000;  // 20 seconds.


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
      tableMessages: [],
      lobbyMessages: [],
      tableUsers: {},
      lobbyUsers: {},
      tableList: [],
      isChallenge: false,
      totalWords: 0,
      answeredByMe: [],
      lastGuess: '',
      lastGuessCorrectness: false,
      challengeData: {},
      displayStyle: this.props.displayStyle,
      numberOfRounds: 0,
      listName: this.props.listName,
      autoSave: this.props.autoSave,
      loadingData: false,
      tablenum: this.props.tablenum,

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
    this.handleTableList = this.handleTableList.bind(this);

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
    console.log('Should send chat to websocket', chat, channel);
    this.websocketBridge.send({
      room: 'lobby',
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
      this.getTables();
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
        this.handleTableList(message.contents);
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
      default:
        window.console.log('Received unrecognized message type:', message.type);
    }
  }

  handleUsersIn(contents) {
    if (contents.room === 'lobby') {
      this.setState({ lobbyUsers: {} });
    }
    this.addUsers(contents.users, contents.room);
  }

  handleAutoSaveToggle() {
    const newAutoSave = !this.state.autoSave;
    if (newAutoSave && !this.state.listName) {
      return;   // There is no list name, don't toggle the checkbox.
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
      this.addMessage(`Autosave is now on! Aerolith will save your
        list progress to ${this.state.listName} at the end of every round.`);
    } else {
      this.addMessage('Autosave is off.', 'error');
    }
  }

  addUsers(users, room) {
    let newUsers;
    if (room === 'lobby') {
      newUsers = this.state.lobbyUsers;
    } else {
      newUsers = this.state.tableUsers;
    }
    users.forEach((user) => {
      newUsers[user] = true;
    });
    if (room === 'lobby') {
      this.setState({ lobbyUsers: newUsers });
    } else {
      this.setState({ tableUsers: newUsers });
    }
  }

  removeUser(user, room) {
    let newUsers;
    if (room === 'lobby') {
      newUsers = this.state.lobbyUsers;
    } else {
      newUsers = this.state.tableUsers;
    }
    delete newUsers[user];
    if (room === 'lobby') {
      this.setState({ lobbyUsers: newUsers });
    } else {
      this.setState({ tableUsers: newUsers });
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

  handleGameGoingPayload(data) {
    this.handleStartReceived(data);
    if (_.has(data, 'time')) {
      this.addMessage(`This round will be over in ${Math.round(data.time)} seconds`);
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
        answeredByMe: game.getAnsweredByMe(),
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

  sendPresence() {
    this.websocketBridge.send({
      type: 'presence',
      room: 'lobby',
      contents: {},
    });
    if (this.state.tablenum !== 0) {
      this.websocketBridge.send({
        type: 'presence',
        room: String(this.state.tablenum),
        contents: {},
      });
    }
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
    let tablenum;
    if (optTablenum) {
      tablenum = optTablenum;
    } else {
      tablenum = this.state.tablenum;
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
    const newGuess = guess.replace(/CH/g, '1').replace(/LL/g, '2').replace(
      /RR/g, '3');
    return newGuess;
  }

  handleGuessResponse(data) {
    if (_.has(data, 'C')) {
      if (data.C !== '') {
        // data.C contains the alphagram.
        game.solve(data.w, data.C);
        this.addMessage(`${data.s} solved ${data.w}`);
        this.setState({
          curQuestions: game.getQuestionState(),
          origQuestions: game.getOriginalQuestionState(),
          answeredByMe: game.getAnsweredByMe(),
          lastGuessCorrectness: true,
        });
      }
    }
  }

  handleChat(data) {
    if (data.room === 'lobby') {
      this.addMessage(data.chat, 'chat', data.sender, true);
    }  // TODO: otherwise send it to the relevant room with false.
  }

  handleTableList(data) {
    this.setState({
      tableList: data,
    });
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
    const curMessages = optIsLobby ? this.state.lobbyMessages :
      this.state.tableMessages;
    curMessages.push({
      author: optSender || '',
      id: _.uniqueId('msg_'),
      content: serverMsg,
      type: optType || 'server',
    });
    if (curMessages.length > MAX_MESSAGES) {
      curMessages.shift();
    }
    if (optIsLobby) {
      this.setState({ lobbyMessages: curMessages });
    } else {
      this.setState({ tableMessages: curMessages });
    }
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
        this.addMessage(`Saved as ${data.listname}`);
      }
      if (data.info) {
        this.addMessage(data.info);
      }
    })
    .fail(jqXHR => this.addMessage(
      `Error saving: ${jqXHR.responseJSON.error}`));
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
   * Handle the loading of a new list into a table.
   * @param  {Object} data
   */
  handleLoadNewList(data) {
    let changeUrl = false;
    // let useReplaceState = false;
    if (data.tablenum !== this.state.tablenum) {
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
      autoSave: data.autosave,
      tablenum: data.tablenum,
      numberOfRounds: 0,
      curQuestions: Immutable.List(),
    });
    this.addMessage(`Loaded new list: ${data.list_name}`, 'info');
    this.showAutosaveMessage(data.autosave);
    if (changeUrl) {
      // The .bind(history) is important because otherwise `this` changes
      // and we get an "illegal invocation". 😒
      // let stateChanger = history.pushState.bind(history);
      // if (useReplaceState) {
      //   stateChanger = history.replaceState.bind(history);
      // }
      history.replaceState({}, `Table ${data.tablenum}`,
        this.tableUrl(data.tablenum));
      document.title = `Wordwalls - table ${data.tablenum}`;
      this.sendSocketJoin(data.tablenum);
    }
  }

  sendSocketJoin(tablenum) {
    this.websocketBridge.send({
      room: String(tablenum),
      type: 'join',
      contents: {},
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
        <Spinner
          visible={this.state.loadingData}
        />
        <TableCreator
          // Normally this is invisible. It is shown by the
          // new-button modal or other conditions (route).
          ref={ref => (this.myTableCreator = ref)}
          defaultLexicon={this.props.defaultLexicon}
          availableLexica={this.props.availableLexica}
          challengeInfo={this.props.challengeInfo}
          tablenum={this.state.tablenum}
          onLoadNewList={this.handleLoadNewList}
          gameGoing={this.state.gameGoing}
          setLoadingData={loading => this.setState({ loadingData: loading })}
          username={this.props.username}
          onChatSubmit={chat => this.onChatSubmit(chat, 'lobby')}
          messages={this.state.lobbyMessages}
          users={Object.keys(this.state.lobbyUsers)}
          tableList={this.state.tableList}
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
          curQuestions={this.state.curQuestions}
          origQuestions={this.state.origQuestions}
          totalWords={this.state.totalWords}
          answeredByMe={this.state.answeredByMe}
          onShuffleQuestion={this.onShuffleQuestion}
          markMissed={this.markMissed}
          challengeData={this.state.challengeData}
          resetTableCreator={this.resetTableCreator}
          tableCreatorModalSelector=".table-modal"
          username={this.props.username}

          onGuessSubmit={this.onGuessSubmit}
          lastGuess={this.state.lastGuess}
          lastGuessCorrectness={this.state.lastGuessCorrectness}
          onHotKey={this.onHotKey}

          handleShuffleAll={this.handleShuffleAll}
          handleAlphagram={this.handleAlphagram}
          handleCustomOrder={this.handleCustomOrder}
          tableMessages={this.state.tableMessages}

          ref={wwApp => (this.wwApp = wwApp)}
        />
      </div>
    );
  }

}

WordwallsAppContainer.propTypes = {
  username: React.PropTypes.string,
  listName: React.PropTypes.string,
  autoSave: React.PropTypes.bool,
  lexicon: React.PropTypes.string,
  displayStyle: React.PropTypes.instanceOf(Styling),
  tablenum: React.PropTypes.number,
  defaultLexicon: React.PropTypes.number,
  challengeInfo: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    name: React.PropTypes.string,
    questions: React.PropTypes.number,
    seconds: React.PropTypes.number,
  })),
  availableLexica: React.PropTypes.arrayOf(React.PropTypes.shape({
    id: React.PropTypes.number,
    lexicon: React.PropTypes.string,
    description: React.PropTypes.string,
    counts: React.PropTypes.object,
  })),
  socketServer: React.PropTypes.string,
};

export default WordwallsAppContainer;
