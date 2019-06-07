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

import backgroundURL from './background';
import Styling from './style';
import Presence from './presence';
import WordwallsGame from './wordwalls_game';
import WordwallsApp from './wordwalls_app';
import Spinner from './spinner';
import TableCreator from './newtable/table_creator';
import GuessEnum from './guess';
import WordwallsAPI from './wordwalls_api';
import WordwallsRPC from './wordwalls_rpc';

const game = new WordwallsGame();
const presence = new Presence();

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
      isChallenge: false,
      isBuild: false,
      totalWords: 0,
      wrongAnswers: 0,
      answeredBy: game.getAnsweredBy(),
      lastGuess: '',
      lastGuessCorrectness: GuessEnum.NONE,
      challengeData: {},
      displayStyle: this.props.displayStyle,
      defaultLexicon: this.props.defaultLexicon,
      numberOfRounds: 0,
      listName: this.props.listName,
      autoSave: this.props.autoSave,
      loadingData: false,
      tablenum: this.props.tablenum,
      currentHost: this.props.currentHost,
      lexicon: this.props.lexicon,
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
    this.handleLoadNewList = this.handleLoadNewList.bind(this);
    this.resetTableCreator = this.resetTableCreator.bind(this);
    this.handleGuessResponse = this.handleGuessResponse.bind(this);
    this.setDefaultLexicon = this.setDefaultLexicon.bind(this);

    this.api = new WordwallsAPI();
    this.rpc = new WordwallsRPC(this.props.tablenum);
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
  }

  onGuessSubmit(guess) {
    let modifiedGuess = this.maybeModifyGuess(guess);
    if (!this.state.gameGoing) {
      // Don't bother submitting guess if the game is over.
      return;
    }
    const hadOctothorp = modifiedGuess.endsWith('#');
    this.setState({
      lastGuess: guess,
      lastGuessCorrectness: GuessEnum.PENDING,
    });
    if (hadOctothorp) {
      // Remove the octothorp.
      modifiedGuess = modifiedGuess.substr(0, modifiedGuess.length - 1);
    }
    if (!game.answerExists(modifiedGuess)) {
      // If the guess wasn't valid, don't bother submitting it to
      // the server.
      if (game.originalAnswerExists(modifiedGuess)) {
        this.setState({
          lastGuessCorrectness: GuessEnum.ALREADYGUESSED,
        });
      } else {
        if (game.markPotentialIncorrectGuess(modifiedGuess)) {
          this.setState(state => ({
            wrongAnswers: state.wrongAnswers + 1,
          }));
        }
        this.setState({
          lastGuessCorrectness: GuessEnum.INCORRECT,
        });
      }
      return;
    }
    if (this.state.displayStyle.requireOctothorp && !this.state.isChallenge) {
      const isCSW = game.isCSW(modifiedGuess);
      if ((isCSW && !hadOctothorp) || (!isCSW && hadOctothorp)) {
        // If the word the user guessed is CSW but doesn't include an
        // octothorp, and the user's settings require an octothorp,
        // mark it zero, dude. (Or, the other way around).
        this.setState({
          lastGuessCorrectness: GuessEnum.INCORRECT_LEXICON_SYMBOL,
        });
        return;
      }
    }
    this.submitGuess(modifiedGuess);
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

  setDefaultLexicon(lexID) {
    this.api.call('/accounts/profile/set_default_lexicon/', {
      defaultLexicon: lexID,
    }).then(() => this.setState({
      defaultLexicon: lexID,
    })).catch(error => this.addMessage(error.message));
  }

  getTables() {
    $.ajax({
      url: '/wordwalls/api/tables/',
      method: 'GET',
    })
      .done((data) => {
        this.handleTables(data);
      });
  }

  submitGuess(guess) {
    this.rpc.guess(guess, this.state.wrongAnswers)
      .then(result => this.handleGuessResponse(result))
      .catch((error) => {
        this.addMessage(error.message);
      });
  }

  handleListNameChange(newListName) {
    this.setState({
      listName: newListName,
    });
  }

  /**
   * NOTE: used for debugging/testing.
   */
  handleAllSolve() {
    const answers = game.getRemainingAnswers();
    answers.forEach((answer, idx) => {
      window.setTimeout(() => {
        this.submitGuess(answer);
      }, (idx * 30));
    });
  }
  /**
   * NOTE: used for debugging/testing
   * @param  {Object} contents
   */
  handleSolveWord(contents) {
    this.submitGuess(contents.word);
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
    this.rpc.startGame()
      .then(result => this.handleStartReceived(result))
      .catch((error) => {
        this.addMessage(error.message);
      });
  }

  handleGiveup() {
    this.rpc.giveUp()
      .then(() => this.processGameEnded())
      .catch((error) => {
        this.addMessage(error.message);
      });
  }

  handleStartReceived(data) {
    if (this.state.gameGoing) {
      return;
    }
    if (_.has(data, 'serverMsg')) {
      this.addMessage(data.serverMsg);
    }
    if (_.has(data, 'questions')) {
      game.init(data.questions, data.gameType);
      this.setState({
        numberOfRounds: this.state.numberOfRounds + 1,
        origQuestions: game.getOriginalQuestionState(),
        curQuestions: game.getQuestionState(),
        answeredBy: game.getAnsweredBy(),
        totalWords: game.getTotalNumWords(),
        wrongAnswers: 0,
      });
      this.wwApp.setGuessBoxFocus();
      window.Intercom('trackEvent', 'started-game', {
        isChallenge: data.gameType && data.gameType.includes('challenge'),
        listname: this.state.listName,
        multiplayer: false,
      });
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

  /**
   * Called when the front-end timer runs out. Make a call to the
   * back-end to possibly end the game.
   */
  timerRanOut() {
    this.rpc.timerRanOut()
      .then(() => this.processGameEnded())
      .catch((error) => {
        this.addMessage(error.message);
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
   * Maybe modify the guess to strip of non-acceptable characters, and
   * to replace spanish digraph tiles with their proper code if
   * lexicon is Spanish.
   * @param  {string} guess
   * @return {string}
   */
  maybeModifyGuess(guess) {
    // Strip whitespace from guess.
    let newGuess = guess.replace(/\s/g, '');

    if (this.state.lexicon !== 'FISE2') {
      return newGuess;
    }
    // Replace.
    newGuess = newGuess
      .replace(/CH/g, '1')
      .replace(/LL/g, '2')
      .replace(/RR/g, '3');
    return newGuess;
  }

  handleGuessResponse(data) {
    let endQuiz = false;
    if (data.g === false) {
      // The quiz has ended
      endQuiz = true;
    }
    if (!_.has(data, 'C') || data.C === '') {
      if (endQuiz) {
        this.processGameEnded();
      }
      return;
    }
    // guessTimer.removeTimer(data.reqId);
    // data.C contains the alphagram.
    const solved = game.solve(data.w, data.C, data.s);
    if (!solved) {
      if (endQuiz) {
        this.processGameEnded();
      }
      return;
    }
    this.setState({
      curQuestions: game.getQuestionState(),
      origQuestions: game.getOriginalQuestionState(),
      answeredBy: game.getAnsweredBy(),
    });
    if (this.state.lastGuessCorrectness === GuessEnum.PENDING) {
      if (data.s === this.props.username) {
        this.setState({
          lastGuessCorrectness: GuessEnum.CORRECT,
        });
      } else if (this.state.lastGuess === data.w) {
        this.setState({
          lastGuessCorrectness: GuessEnum.ALREADYGUESSED,
        });
      }
      // XXX: Otherwise keep it pending?
    }
    if (endQuiz) {
      this.processGameEnded();
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

  addErrorMessage(errMsg) {
    this.addMessage(errMsg.error);
  }

  addMessage(serverMsg, optType, optSender) {
    const message = {
      author: optSender || '',
      id: _.uniqueId('msg_'),
      content: serverMsg,
      type: optType || 'server',
    };
    presence.addMessage(message, false);
    this.setState({
      messages: presence.getMessages(),
    });
  }

  processGameEnded() {
    if (!this.state.gameGoing) {
      return;
    }
    this.setState({
      gameGoing: false,
    });
    if (this.state.autoSave) {
      this.saveGame();
    }
    if (this.state.numberOfRounds === 1 && this.state.isChallenge) {
      // XXX: Kind of ugly, breaks encapsulation.
      this.api.call('/wordwalls/api/challengers_by_tablenum/', {
        tablenum: this.state.tablenum,
        tiebreaker: this.state.displayStyle.hideErrors ? 'time' : 'errors',
      }, 'GET').then(data => this.setState({
        challengeData: data,
      })).catch(error => this.addMessage(error.message));
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
      lexicon: data.lexicon,
      autoSave: data.autosave && !data.multiplayer,
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
      window.history.replaceState(
        {}, `Table ${data.tablenum}`,
        this.tableUrl(data.tablenum),
      );
      this.rpc.setTablenum(data.tablenum);
      document.title = `Wordwalls - table ${data.tablenum}`;
    }
    window.Intercom('trackEvent', 'loaded-new-list', {
      listName: data.list_name,
      multiplayer: false,
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
    const questionWidth = 176;
    const questionHeight = 30;
    let boardGridWidth;
    let boardGridHeight = 13;
    // Magic numbers; if we modify these we'll have to figure something out.
    if (this.state.windowWidth < 768) {
      // We take up 100%.
      boardGridWidth = Math.max(Math.floor(this.state.windowWidth / questionWidth), 1);
    } else if (this.state.windowWidth < 992) {
      // This gets tricky because the UserBox component gets in the way.
      boardGridWidth = 3;
    } else if (this.state.windowWidth < 1200) {
      boardGridWidth = 4;
    } else {
      boardGridWidth = 5;
      boardGridHeight = 10;
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
          defaultLexicon={this.state.defaultLexicon}
          setDefaultLexicon={this.setDefaultLexicon}
          availableLexica={this.props.availableLexica}
          challengeInfo={this.props.challengeInfo}
          tablenum={this.state.tablenum}
          currentHost={this.state.currentHost}
          onLoadNewList={this.handleLoadNewList}
          gameGoing={this.state.gameGoing}
          setLoadingData={loading => this.setState({ loadingData: loading })}
          username={this.props.username}
          hideErrors={this.state.displayStyle.hideErrors}
        />
        <WordwallsApp
          boardWidth={boardWidth}
          boardHeight={boardHeight}
          boardGridWidth={boardGridWidth}
          boardGridHeight={boardGridHeight}
          windowWidth={this.state.windowWidth}

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
          wrongAnswers={this.state.wrongAnswers}
          hideErrors={this.state.displayStyle.hideErrors}

          onGuessSubmit={this.onGuessSubmit}
          lastGuess={this.state.lastGuess}
          lastGuessCorrectness={this.state.lastGuessCorrectness}
          onHotKey={this.onHotKey}

          handleShuffleAll={this.handleShuffleAll}
          handleAlphagram={this.handleAlphagram}
          handleCustomOrder={this.handleCustomOrder}
          tableMessages={this.state.messages.get('table', Immutable.List()).toJS()}
          ref={(wwApp) => {
            this.wwApp = wwApp;
          }}
        />
      </div>
    );
  }
}

WordwallsAppContainer.defaultProps = {
  listName: '',
};

WordwallsAppContainer.propTypes = {
  username: PropTypes.string.isRequired,
  listName: PropTypes.string,
  autoSave: PropTypes.bool.isRequired,
  lexicon: PropTypes.string.isRequired,
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  tablenum: PropTypes.number.isRequired,
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
};

export default WordwallsAppContainer;
