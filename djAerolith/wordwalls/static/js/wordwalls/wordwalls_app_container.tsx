/**
 * @fileOverview The container for the wordwalls_app. This container
 * should have all state, ajax, etc instead and wordwalls_app should
 * be as dumb as possible.
 */
/* eslint-disable new-cap, jsx-a11y/no-static-element-interactions */
import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import $ from 'jquery';
import _ from 'underscore';
import Immutable from 'immutable';

import backgroundURL, { darkBackgrounds, getAppropriateBackground } from './background';
import Styling from './style';
import Presence from './presence';
import WordwallsGame from './wordwalls_game';
import WordwallsApp, { type WordwallsAppRef } from './wordwalls_app';
import Spinner from './spinner';
import TableCreator from './newtable/table_creator';
import { applyDarkModeToExistingModals, setupDarkModeModalObserver, removeDarkModeFromExistingModals } from './modal_dark_mode';
import GuessEnum from './guess';
import WordwallsAPI from './wordwalls_api';
import WordwallsRPC from './wordwalls_rpc';

interface ChallengeInfoItem {
  id?: number;
  lexicon?: string;
  numQuestions?: number;
  seconds?: number;
  timeCreated?: string;
  createdBy?: string;
  name?: string;
  description?: string;
}

interface AvailableLexicon {
  id?: number;
  lexicon: string;
  description: string;
  lengthCounts?: Record<string, number>;
  wordCount?: number;
}

interface ChallengeEntry {
  user: string;
  score: number;
  tr: number;
  w: number;
  addl: string;
}

interface ChallengeData {
  entries?: ChallengeEntry[];
  maxScore?: number;
}

interface TableMessage {
  author: string;
  id: string;
  content: string;
  type: string;
}

interface WordwallsAppContainerProps {
  username: string;
  listName?: string;
  autoSave: boolean;
  lexicon: string;
  displayStyle: Styling;
  tablenum: number;
  currentHost: string;
  defaultLexicon: number;
  challengeInfo: ChallengeInfoItem[];
  availableLexica: AvailableLexicon[];
}

// Create game and presence instances
const game = new WordwallsGame();
const presence = new Presence();

function WordwallsAppContainer({
  username,
  listName: initialListName = '',
  autoSave: initialAutoSave,
  lexicon: initialLexicon,
  displayStyle: initialDisplayStyle,
  tablenum: initialTablenum,
  currentHost: initialCurrentHost,
  defaultLexicon: initialDefaultLexicon,
  challengeInfo,
  availableLexica,
}: WordwallsAppContainerProps) {
  const [gameGoing, setGameGoing] = useState(false);
  const [initialGameTime, setInitialGameTime] = useState(0);
  const [origQuestions, setOrigQuestions] = useState(game.getOriginalQuestionState());
  const [curQuestions, setCurQuestions] = useState(game.getQuestionState());
  const [messages, setMessages] = useState(presence.getMessages());
  const [isChallenge, setIsChallenge] = useState(false);
  const [isBuild, setIsBuild] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [answeredBy, setAnsweredBy] = useState(game.getAnsweredBy());
  const [lastGuess, setLastGuess] = useState('');
  const [lastGuessCorrectness, setLastGuessCorrectness] = useState(GuessEnum.NONE);
  const [challengeData, setChallengeData] = useState<ChallengeData>({});
  const [displayStyle, setDisplayStyleState] = useState(initialDisplayStyle);
  const [defaultLexicon, setDefaultLexiconState] = useState(initialDefaultLexicon);
  const [numberOfRounds, setNumberOfRounds] = useState(0);
  const [listName, setListNameState] = useState(initialListName);
  const [autoSave, setAutoSaveState] = useState(initialAutoSave);
  const [loadingData, setLoadingData] = useState(false);
  const [tablenum, setTablenumState] = useState(initialTablenum);
  const [currentHost] = useState(initialCurrentHost);
  const [lexicon, setLexiconState] = useState(initialLexicon);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const wwAppRef = useRef<WordwallsAppRef>(null);
  const myTableCreatorRef = useRef<{ showModal:() => void; resetDialog: () => void }>(null);
  const apiRef = useRef(new WordwallsAPI());
  const rpcRef = useRef(new WordwallsRPC(initialTablenum));

  const handleResize = useCallback(() => {
    setWindowWidth(window.innerWidth);
  }, []);

  const tableUrl = useCallback((optTablenum?: number): string => {
    const currentTablenum = optTablenum || tablenum;
    return `/wordwalls/table/${currentTablenum}/`;
  }, [tablenum]);

  const beforeUnload = useCallback(() => {
    if (gameGoing) {
      $.ajax({
        url: tableUrl(),
        async: false,
        data: {
          action: 'giveUpAndSave',
          // Fool the endpoint; if autosave is not on, don't actually
          // save with a listname.
          listname: autoSave ? listName : '',
        },
        method: 'POST',
      });
    }
  }, [gameGoing, autoSave, listName, tableUrl]);

  const addMessage = useCallback((serverMsg: string, optType?: string, optSender?: string) => {
    const message: TableMessage = {
      author: optSender || '',
      id: _.uniqueId('msg_'),
      content: serverMsg,
      type: optType || 'server',
    };
    presence.addMessage(message, false);
    setMessages(presence.getMessages());
  }, []);

  const maybeModifyGuess = useCallback((guess: string): string => {
    // Strip whitespace from guess.
    let newGuess = guess.replace(/\s/g, '');

    if (lexicon !== 'FISE2') {
      return newGuess;
    }
    // Replace.
    newGuess = newGuess
      .replace(/CH/g, '1')
      .replace(/LL/g, '2')
      .replace(/RR/g, '3');
    return newGuess;
  }, [lexicon]);

  const showAutosaveMessage = useCallback((autosaveEnabled: boolean) => {
    if (autosaveEnabled) {
      addMessage(
        `Autosave is now on! Aerolith will save your
        list progress to ${listName} at the end of every round.`,
        'info',
      );
    } else {
      addMessage('Autosave is off.', 'error');
    }
  }, [addMessage, listName]);

  const saveGame = useCallback(() => {
    if (listName === '') {
      addMessage('You must enter a list name for saving!', 'error');
      return;
    }
    $.ajax({
      url: tableUrl(),
      method: 'POST',
      data: {
        action: 'save',
        listname: listName,
      },
      dataType: 'json',
    })
      .done((data) => {
        if (data.success === true) {
          addMessage(`Saved as ${data.listname}`, 'info');
        }
        if (data.info) {
          addMessage(data.info);
        }
      })
      .fail((jqXHR) => addMessage(`Error saving: ${jqXHR.responseJSON.error}`, 'error'));
  }, [listName, tableUrl, addMessage]);

  const processGameEnded = useCallback(() => {
    if (!gameGoing) {
      return;
    }
    setGameGoing(false);
    if (autoSave) {
      saveGame();
    }
    if (numberOfRounds === 1 && isChallenge) {
      // XXX: Kind of ugly, breaks encapsulation.
      apiRef.current.call('/wordwalls/api/challengers_by_tablenum/', {
        tablenum,
        tiebreaker: displayStyle.hideErrors ? 'time' : 'errors',
      }, 'GET').then((data) => setChallengeData(data))
        .catch((error) => addMessage(error.message));
    }
  }, [
    gameGoing, autoSave, saveGame, numberOfRounds, isChallenge, tablenum,
    displayStyle.hideErrors, addMessage,
  ]);

  const handleGuessResponse = useCallback((data: {
    g?: boolean;
    C?: string;
    w?: string;
    s?: string;
  }) => {
    let endQuiz = false;
    if (data.g === false) {
      // The quiz has ended
      endQuiz = true;
    }
    if (!_.has(data, 'C') || data.C === '') {
      if (endQuiz) {
        processGameEnded();
      }
      return;
    }
    // guessTimer.removeTimer(data.reqId);
    // data.C contains the alphagram.
    const solved = game.solve(data.w!, data.C!, data.s!);
    if (!solved) {
      if (endQuiz) {
        processGameEnded();
      }
      return;
    }
    setCurQuestions(game.getQuestionState());
    setOrigQuestions(game.getOriginalQuestionState());
    setAnsweredBy(game.getAnsweredBy());

    if (lastGuessCorrectness === GuessEnum.PENDING) {
      if (data.s === username) {
        setLastGuessCorrectness(GuessEnum.CORRECT);
      } else if (lastGuess === data.w) {
        setLastGuessCorrectness(GuessEnum.ALREADYGUESSED);
      }
      // XXX: Otherwise keep it pending?
    }
    if (endQuiz) {
      processGameEnded();
    }
  }, [processGameEnded, lastGuessCorrectness, lastGuess, username]);

  const submitGuess = useCallback((guess: string) => {
    rpcRef.current.guess(guess, wrongAnswers)
      .then((result) => handleGuessResponse(result))
      .catch((error) => {
        addMessage(error.message);
      });
  }, [wrongAnswers, handleGuessResponse, addMessage]);

  const handleStartReceived = useCallback((data: {
    serverMsg?: string;
    questions?: unknown;
    gameType?: string;
    time?: number;
  }) => {
    if (gameGoing) {
      return;
    }
    if (_.has(data, 'serverMsg')) {
      addMessage(data.serverMsg!);
    }
    if (_.has(data, 'questions')) {
      game.init(data.questions, data.gameType);
      setNumberOfRounds((prev) => prev + 1);
      setOrigQuestions(game.getOriginalQuestionState());
      setCurQuestions(game.getQuestionState());
      setAnsweredBy(game.getAnsweredBy());
      setTotalWords(game.getTotalNumWords());
      setWrongAnswers(0);

      wwAppRef.current?.setGuessBoxFocus();
      window.Intercom('trackEvent', 'started-game', {
        isChallenge: data.gameType && data.gameType.includes('challenge'),
        listname: listName,
        multiplayer: false,
      });
    }

    if (_.has(data, 'time')) {
      // Convert time to milliseconds.
      setInitialGameTime(data.time! * 1000);
      setGameGoing(true);
    }
    if (_.has(data, 'gameType')) {
      setIsChallenge(data.gameType!.includes('challenge'));
      setIsBuild(data.gameType!.includes('build'));
      setIsTyping(data.gameType!.includes('typing'));
    }
  }, [gameGoing, addMessage, listName]);

  const timerRanOut = useCallback(() => {
    rpcRef.current.timerRanOut()
      .then(() => processGameEnded())
      .catch((error) => {
        addMessage(error.message);
      });
  }, [processGameEnded, addMessage]);

  const handleStart = useCallback(() => {
    rpcRef.current.startGame()
      .then((result) => handleStartReceived(result))
      .catch((error) => {
        addMessage(error.message);
      });
  }, [handleStartReceived, addMessage]);

  const handleGiveup = useCallback(() => {
    rpcRef.current.giveUp()
      .then(() => processGameEnded())
      .catch((error) => {
        addMessage(error.message);
      });
  }, [processGameEnded, addMessage]);

  const handleListNameChange = useCallback((newListName: string) => {
    setListNameState(newListName);
  }, []);

  const handleAutoSaveToggle = useCallback(() => {
    setAutoSaveState((prevAutoSave) => {
      const newAutoSave = !prevAutoSave;
      if (newAutoSave && !listName) {
        return false; // There is no list name, don't toggle the checkbox.
      }
      return newAutoSave;
    });
  }, [listName]);

  // Handle autosave state change effects
  useEffect(() => {
    if (autoSave && !gameGoing) {
      saveGame();
    }
    showAutosaveMessage(autoSave);
  }, [autoSave, gameGoing, saveGame, showAutosaveMessage]);

  const handleShuffleAll = useCallback(() => {
    game.shuffleAll();
    setCurQuestions(game.getQuestionState());
    wwAppRef.current?.setGuessBoxFocus();
  }, []);

  const handleAlphagram = useCallback(() => {
    game.resetAllOrders();
    setCurQuestions(game.getQuestionState());
    wwAppRef.current?.setGuessBoxFocus();
  }, []);

  const handleCustomOrder = useCallback(() => {
    game.setCustomLetterOrder(displayStyle.customTileOrder);
    setCurQuestions(game.getQuestionState());
    wwAppRef.current?.setGuessBoxFocus();
  }, [displayStyle.customTileOrder]);

  const handleLoadNewList = useCallback((data: {
    tablenum: number;
    list_name: string;
    lexicon: string;
    autosave: boolean;
    multiplayer: boolean;
  }) => {
    let changeUrl = false;
    const oldTablenum = tablenum;
    if (data.tablenum !== oldTablenum) {
      changeUrl = true;
    }
    setListNameState(data.list_name);
    setLexiconState(data.lexicon);
    setAutoSaveState(data.autosave && !data.multiplayer);
    setTablenumState(data.tablenum);
    setNumberOfRounds(0);
    setCurQuestions(Immutable.List());

    addMessage(`Loaded new list: ${data.list_name}`, 'info');
    showAutosaveMessage(data.autosave);

    if (changeUrl) {
      window.history.replaceState(
        {},
        `Table ${data.tablenum}`,
        tableUrl(data.tablenum),
      );
      rpcRef.current.setTablenum(data.tablenum);
      document.title = `Wordwalls - table ${data.tablenum}`;
    }
    window.Intercom('trackEvent', 'loaded-new-list', {
      listName: data.list_name,
      multiplayer: false,
    });
  }, [tablenum, addMessage, showAutosaveMessage, tableUrl]);

  const onGuessSubmit = useCallback((guess: string) => {
    const modifiedGuess = maybeModifyGuess(guess);
    if (!gameGoing) {
      // Don't bother submitting guess if the game is over.
      return;
    }
    const hadOctothorp = modifiedGuess.endsWith('#');
    setLastGuess(guess);
    setLastGuessCorrectness(GuessEnum.PENDING);

    let finalGuess = modifiedGuess;
    if (hadOctothorp) {
      // Remove the octothorp.
      finalGuess = modifiedGuess.substr(0, modifiedGuess.length - 1);
    }

    if (!game.answerExists(finalGuess)) {
      // If the guess wasn't valid, don't bother submitting it to
      // the server.
      if (game.originalAnswerExists(finalGuess)) {
        setLastGuessCorrectness(GuessEnum.ALREADYGUESSED);
      } else {
        if (game.markPotentialIncorrectGuess(finalGuess)) {
          setWrongAnswers((prev) => prev + 1);
        }
        setLastGuessCorrectness(GuessEnum.INCORRECT);
      }
      return;
    }

    if (displayStyle.requireOctothorp && !isChallenge) {
      const isCSW = game.isCSW(finalGuess);
      if ((isCSW && !hadOctothorp) || (!isCSW && hadOctothorp)) {
        // If the word the user guessed is CSW but doesn't include an
        // octothorp, and the user's settings require an octothorp,
        // mark it zero, dude. (Or, the other way around).
        setLastGuessCorrectness(GuessEnum.INCORRECT_LEXICON_SYMBOL);
        return;
      }
    }
    submitGuess(finalGuess);
  }, [maybeModifyGuess, gameGoing, displayStyle.requireOctothorp, isChallenge, submitGuess]);

  const onHotKey = useCallback((key: string) => {
    // Hot key map.
    const fnMap: Record<string, () => void> = {
      1: handleShuffleAll,
      2: handleAlphagram,
      3: handleCustomOrder,
    };
    fnMap[key]?.();
  }, [handleShuffleAll, handleAlphagram, handleCustomOrder]);

  const onShuffleQuestion = useCallback((idx: number) => {
    game.shuffle(idx);
    setCurQuestions(game.getQuestionState());
  }, []);

  const setDisplayStyle = useCallback((style: Styling) => {
    // Check if dark mode changed
    const darkModeChanged = displayStyle.darkMode !== style.darkMode;

    // If dark mode changed, update the body class and adjust backgrounds if needed
    if (darkModeChanged) {
      if (style.darkMode) {
        document.body.classList.add('dark-mode');
        // Set appropriate backgrounds for dark mode if we're not already using dark backgrounds
        if (!darkBackgrounds.has(style.background)) {
          style.setStyleKey('background', getAppropriateBackground(style.background, true, false));
        }
        if (!darkBackgrounds.has(style.bodyBackground)) {
          style.setStyleKey('bodyBackground', getAppropriateBackground(style.bodyBackground, true, true));
        }
      } else {
        document.body.classList.remove('dark-mode');
        // If we were using dark backgrounds, switch to light ones
        if (darkBackgrounds.has(style.background)) {
          style.setStyleKey('background', getAppropriateBackground(style.background, false, false));
        }
        if (darkBackgrounds.has(style.bodyBackground)) {
          style.setStyleKey('bodyBackground', getAppropriateBackground(style.bodyBackground, false, true));
        }
      }

      // Dark mode preference is stored in the database via the AJAX call below

      // Apply or remove dark mode for modals
      if (style.darkMode) {
        setTimeout(() => {
          applyDarkModeToExistingModals();
          setupDarkModeModalObserver();
        }, 100);
      } else {
        // When switching back to light mode, explicitly remove dark mode from modals
        setTimeout(() => {
          removeDarkModeFromExistingModals();
        }, 100);
      }
    }

    setDisplayStyleState(style);
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
  }, [displayStyle.darkMode]);

  const setDefaultLexicon = useCallback((lexID: number) => {
    apiRef.current.call('/accounts/profile/set_default_lexicon/', {
      defaultLexicon: lexID,
    }).then(() => setDefaultLexiconState(lexID))
      .catch((error) => addMessage(error.message));
  }, [addMessage]);

  const markMissed = useCallback((alphaIdx: number, alphagram: string) => {
    // Mark the alphagram missed.
    $.ajax({
      url: `${tableUrl()}missed/`,
      method: 'POST',
      dataType: 'json',
      data: {
        idx: alphaIdx,
      },
    })
      .done((data) => {
        if (data.success === true) {
          game.miss(alphagram);
          setOrigQuestions(game.getOriginalQuestionState());
        }
      });
  }, [tableUrl]);

  const resetTableCreator = useCallback(() => {
    myTableCreatorRef.current?.resetDialog();
  }, []);

  useEffect(() => {
    // Set up beforeUnloadEventHandler here.
    window.onbeforeunload = beforeUnload;
    // Disallow backspace to go back to previous page.
    const handleKeydown = (e: JQuery.KeyDownEvent) => {
      if (e.which === 8) {
        // 8 == backspace
        if (e.target.tagName !== 'INPUT' || e.target.disabled || e.target.readOnly) {
          e.preventDefault();
        }
      }
    };
    $(document).bind('keydown keypress', handleKeydown);

    window.addEventListener('resize', handleResize);
    // Tooltip.
    $('.hovertip').tooltip({
      placement: 'bottom',
    });

    $('body').css({
      'background-image': backgroundURL(displayStyle.bodyBackground),
    });

    // Apply dark mode if needed
    if (displayStyle.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Finally, show table creation modal if tablenum is 0. This whole
    // thing is a bit of an anti-pattern because of our modals/Bootstrap/etc
    // Maybe there's a better way to hide/show modals using more React
    // idioms.
    if (tablenum === 0) {
      myTableCreatorRef.current?.showModal();
      myTableCreatorRef.current?.resetDialog();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      $(document).unbind('keydown keypress', handleKeydown);
    };
  }, [beforeUnload, handleResize, displayStyle.bodyBackground, displayStyle.darkMode, tablenum]);

  // Calculate board width, height, grid dimensions from window
  // dimensions.
  // This is the size of a question in pixels. We should make these
  // dynamic later to allow users to zoom in, etc.
  const questionWidth = 176;
  const questionHeight = 30;
  let boardGridWidth: number;
  let boardGridHeight = 13;
  // Magic numbers; if we modify these we'll have to figure something out.
  if (windowWidth < 768) {
    // We take up 100%.
    boardGridWidth = Math.max(Math.floor(windowWidth / questionWidth), 1);
  } else if (windowWidth < 992) {
    // This gets tricky because the UserBox component gets in the way.
    boardGridWidth = 3;
  } else if (windowWidth < 1200) {
    boardGridWidth = 4;
  } else {
    boardGridWidth = 5;
    boardGridHeight = 10;
  }

  const boardWidth = questionWidth * boardGridWidth;
  const boardHeight = questionHeight * boardGridHeight;
  game.setMaxOnScreenQuestions(boardGridWidth * boardGridHeight);
  // Add dark-mode class to container if dark mode is enabled
  const containerClasses = `wordwalls-app-container${displayStyle.darkMode ? ' dark-mode-container' : ''}`;

  return (
    <div
      className={containerClasses}
      data-display-style={JSON.stringify(displayStyle)}
    >
      <Spinner
        visible={loadingData}
      />
      <TableCreator
        // Normally this is invisible. It is shown by the
        // new-button modal or other conditions (route).
        ref={myTableCreatorRef}
        defaultLexicon={defaultLexicon}
        setDefaultLexicon={setDefaultLexicon}
        availableLexica={availableLexica}
        challengeInfo={challengeInfo}
        tablenum={tablenum}
        currentHost={currentHost}
        onLoadNewList={handleLoadNewList}
        gameGoing={gameGoing}
        setLoadingData={setLoadingData}
        username={username}
        hideErrors={displayStyle.hideErrors}
      />
      <WordwallsApp
        boardWidth={boardWidth}
        boardHeight={boardHeight}
        boardGridWidth={boardGridWidth}
        boardGridHeight={boardGridHeight}
        windowWidth={windowWidth}
        listName={listName}
        autoSave={autoSave}
        onListNameChange={handleListNameChange}
        onAutoSaveToggle={handleAutoSaveToggle}
        displayStyle={displayStyle}
        setDisplayStyle={setDisplayStyle}
        handleStart={handleStart}
        handleGiveup={handleGiveup}
        gameGoing={gameGoing}
        initialGameTime={initialGameTime}
        timerRanOut={timerRanOut}
        numberOfRounds={numberOfRounds}
        isChallenge={isChallenge}
        isBuild={isBuild}
        isTyping={isTyping}
        curQuestions={curQuestions}
        origQuestions={origQuestions}
        totalWords={totalWords}
        answeredBy={answeredBy}
        onShuffleQuestion={onShuffleQuestion}
        markMissed={markMissed}
        challengeData={challengeData}
        resetTableCreator={resetTableCreator}
        tableCreatorModalSelector=".table-modal"
        username={username}
        wrongAnswers={wrongAnswers}
        hideErrors={displayStyle.hideErrors}
        onGuessSubmit={onGuessSubmit}
        lastGuess={lastGuess}
        lastGuessCorrectness={lastGuessCorrectness}
        onHotKey={onHotKey}
        handleShuffleAll={handleShuffleAll}
        handleAlphagram={handleAlphagram}
        handleCustomOrder={handleCustomOrder}
        tableMessages={messages.get('table', Immutable.List()).toJS() as TableMessage[]}
        ref={wwAppRef}
      />
    </div>
  );
}

export default WordwallsAppContainer;
