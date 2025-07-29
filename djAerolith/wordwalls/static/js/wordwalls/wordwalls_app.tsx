import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import * as Immutable from 'immutable';

import ListSaveBar from './topbar/save_list';
import SettingsCog from './topbar/settings_cog';
import GiveUpButton from './topbar/give_up_button';
import GameTimer from './topbar/game_timer';
import GameArea from './gamearea';
import UserBox from './user_box';
import ReducedUserBox from './reduced_user_box';
import GuessBox from './bottombar/guessbox';
import ShuffleButtons from './topbar/shufflebuttons';
import ChatBox from './bottombar/chatbox';
import Styling from './style';
import { type ImmutableQuestion } from './immutable-types';

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

interface WordwallsAppProps {
  listName?: string;
  autoSave?: boolean;
  onListNameChange: (name: string) => void;
  onAutoSaveToggle: () => void;
  displayStyle: Styling;
  setDisplayStyle: (style: Styling) => void;
  handleStart: () => void;
  handleGiveup: () => void;
  gameGoing: boolean;
  initialGameTime: number;
  timerRanOut: () => void;
  numberOfRounds: number;
  isChallenge: boolean;
  isBuild: boolean;
  isTyping: boolean;
  curQuestions: Immutable.List<ImmutableQuestion>;
  origQuestions: Immutable.OrderedMap<string, ImmutableQuestion>;
  totalWords: number;
  answeredBy: Immutable.Map<string, Immutable.List<Immutable.Map<string, string>>>;
  onShuffleQuestion: (idx: number) => void;
  markMissed: (idx: number, alphagram: string) => void;
  wrongAnswers: number;
  hideErrors: boolean;
  boardWidth: number;
  boardHeight: number;
  boardGridWidth: number;
  boardGridHeight: number;
  windowWidth: number;
  challengeData: ChallengeData;
  resetTableCreator: () => void;
  tableCreatorModalSelector: string;
  username: string;
  onGuessSubmit: (guess: string) => void;
  lastGuess: string;
  lastGuessCorrectness: number;
  onHotKey: (key: string) => void;
  handleShuffleAll: () => void;
  handleAlphagram: () => void;
  handleCustomOrder: () => void;
  tableMessages: TableMessage[];
}

export interface WordwallsAppRef {
  setGuessBoxFocus: () => void;
}

const WordwallsApp = forwardRef<WordwallsAppRef, WordwallsAppProps>(({
  listName = '',
  autoSave = false,
  onListNameChange,
  onAutoSaveToggle,
  displayStyle,
  setDisplayStyle,
  handleStart,
  handleGiveup,
  gameGoing,
  initialGameTime,
  timerRanOut,
  numberOfRounds,
  isChallenge,
  isBuild,
  isTyping,
  curQuestions,
  origQuestions,
  totalWords,
  answeredBy,
  onShuffleQuestion,
  markMissed,
  wrongAnswers,
  hideErrors,
  boardWidth,
  boardHeight,
  boardGridWidth,
  boardGridHeight,
  windowWidth,
  challengeData,
  resetTableCreator,
  tableCreatorModalSelector,
  username,
  onGuessSubmit,
  lastGuess,
  lastGuessCorrectness,
  onHotKey,
  handleShuffleAll,
  handleAlphagram,
  handleCustomOrder,
  tableMessages,
}, ref) => {
  const guessBoxRef = useRef<{ setFocus:() => void }>(null);

  useImperativeHandle(ref, () => ({
    setGuessBoxFocus: () => {
      guessBoxRef.current?.setFocus();
    },
  }));

  const getNumCorrectAnswers = (): number => answeredBy.get(username, Immutable.List()).size;

  const renderTopNav = () => (
    <div className="row">
      <div className="col-6 col-sm-5 col-md-5 col-lg-5">
        <ListSaveBar
          listName={listName}
          autoSave={autoSave}
          onListNameChange={onListNameChange}
          onAutoSaveToggle={onAutoSaveToggle}
          disableEditing={false}
        />
      </div>
      <div
        className="col-1 col-sm-1 col-md-1 col-lg-1"
        style={{
          marginTop: '-4px',
        }}
      >
        <SettingsCog
          displayStyle={displayStyle}
          onSave={setDisplayStyle}
        />
      </div>
      <div
        className="col-4 col-sm-4 offset-sm-2 col-md-3
          offset-md-3 col-lg-2"
        style={{ whiteSpace: 'nowrap' }}
      >
        <GiveUpButton
          handleGiveup={handleGiveup}
          gameGoing={gameGoing}
        />
        <GameTimer
          initialGameTime={initialGameTime}
          completeCallback={timerRanOut}
          gameGoing={gameGoing}
        />
      </div>
    </div>
  );

  const renderLeftSide = () => (
    <div>
      <div className="row">
        <div className="col-12 col-sm-12 col-md-12 col-lg-12">
          <GameArea
            numberOfRounds={numberOfRounds}
            isChallenge={isChallenge}
            isBuild={isBuild}
            isTyping={isTyping}
            curQuestions={curQuestions}
            origQuestions={origQuestions}
            displayStyle={displayStyle}
            totalWords={totalWords}
            numCorrect={getNumCorrectAnswers()}
            onShuffle={onShuffleQuestion}
            gameGoing={gameGoing}
            markMissed={markMissed}
            width={boardWidth}
            height={boardHeight}
            gridWidth={boardGridWidth}
            gridHeight={boardGridHeight}
            windowWidth={windowWidth}
            challengeData={challengeData}
            resetTableCreator={resetTableCreator}
            tableCreatorModalSelector={tableCreatorModalSelector}
            listName={listName}
            answerers={answeredBy}
            handleStart={handleStart}
            hideErrors={hideErrors}
          />
        </div>
      </div>

      <div
        className="row"
        style={{
          marginTop: '4px',
        }}
      >
        <div className="col-7 col-sm-6 col-md-6 col-lg-5">
          <GuessBox
            onGuessSubmit={onGuessSubmit}
            lastGuess={lastGuess}
            lastGuessCorrectness={lastGuessCorrectness}
            onHotKey={onHotKey}
            ref={guessBoxRef}
          />
        </div>
        <div
          className="col-5 col-sm-6 col-md-6 col-lg-7"
          style={{
            marginTop: '-3px',
          }}
        >
          <ShuffleButtons
            shuffle={handleShuffleAll}
            alphagram={handleAlphagram}
            customOrder={handleCustomOrder}
          />
        </div>
      </div>

      <div className="row" style={{ marginTop: '4px' }}>
        <div className="col-12">
          <ChatBox messages={tableMessages} />
        </div>
      </div>
    </div>
  );

  const renderRightSide = () => (
    <div>
      <div className="row">
        <div className="col-sm-12 col-md-12 col-lg-12">
          <UserBox
            showLexiconSymbols={!displayStyle.hideLexiconSymbols}
            answers={answeredBy.get(username, Immutable.List())}
            wrongAnswers={wrongAnswers}
            hideErrors={hideErrors}
            totalWords={totalWords}
            username={username}
            isBuild={isBuild}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="row">
        <div className="col-12 col-sm-9 col-md-9 col-lg-9">
          {renderTopNav()}
        </div>
      </div>
      <div className="row">
        <div className="col-12 col-sm-9 col-md-9 col-lg-9">
          {renderLeftSide()}
        </div>
        <div className="d-none d-sm-block col-sm-3 col-md-3 col-lg-2">
          {renderRightSide()}
        </div>
      </div>

      <div className="row d-block d-sm-none">
        <div className="col-12">
          <ReducedUserBox
            numCorrect={getNumCorrectAnswers()}
            wrongAnswers={wrongAnswers}
            totalWords={totalWords}
            username={username}
            isBuild={isBuild}
          />
        </div>
      </div>
    </div>
  );
});

WordwallsApp.displayName = 'WordwallsApp';

export default WordwallsApp;
