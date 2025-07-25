import React, { useEffect } from 'react';
import Immutable from 'immutable';
import $ from 'jquery';

import GameInactiveArea from './game_inactive_area';
import Styling from './style';
import SVGBoard from './svg_board';
import BuildBoard from './build_board';
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

interface GameAreaProps {
  numberOfRounds: number;
  curQuestions: Immutable.List<ImmutableQuestion>;
  origQuestions: Immutable.OrderedMap<string, ImmutableQuestion>;
  displayStyle: Styling;
  totalWords: number;
  numCorrect: number;
  onShuffle: (idx: number) => void;
  gameGoing: boolean;
  markMissed: (idx: number, alphagram: string) => void;
  answerers: Immutable.Map<string, Immutable.List<Immutable.Map<string, string>>>;
  challengeData: ChallengeData;
  isChallenge: boolean;
  isBuild: boolean;
  isTyping: boolean;
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  windowWidth: number;
  resetTableCreator: () => void;
  tableCreatorModalSelector: string;
  listName: string;
  hideErrors: boolean;
  handleStart: () => void;
}

function GameArea({
  numberOfRounds,
  curQuestions,
  origQuestions,
  displayStyle,
  totalWords,
  numCorrect,
  onShuffle,
  gameGoing,
  markMissed,
  answerers,
  challengeData,
  isChallenge,
  isBuild,
  isTyping,
  width,
  height,
  gridWidth,
  gridHeight,
  windowWidth,
  resetTableCreator,
  tableCreatorModalSelector,
  listName,
  hideErrors,
  handleStart,
}: GameAreaProps) {
  useEffect(() => {
    // Hide any modals when a game starts
    if (gameGoing) {
      $('.modal').modal('hide');
    }
  }, [gameGoing]);

  let scaleTransform = 1.0;
  if (windowWidth > 1200) {
    switch (displayStyle.upscaleWithWindowSize) {
      case 'none':
        break;
      case 'small':
        scaleTransform = (windowWidth + 1200) / 2400;
        break;
      case 'large':
        scaleTransform = (windowWidth / 1200);
        break;
      default:
        break;
    }
  }

  if (gameGoing) {
    if (isBuild) {
      return (
        <BuildBoard
          onShuffle={onShuffle}
          answerers={answerers}
          displayStyle={displayStyle}
          width={width}
          questions={curQuestions}
          origQuestions={origQuestions}
          scaleTransform={scaleTransform}
        />
      );
    }
    return (
      <SVGBoard
        onShuffle={onShuffle}
        displayStyle={displayStyle}
        width={width}
        height={height}
        gridWidth={gridWidth}
        gridHeight={gridHeight}
        questions={curQuestions}
        scaleTransform={scaleTransform}
        isTyping={isTyping}
      />
    );
  }

  return (
    <GameInactiveArea
      questions={origQuestions}
      numCorrect={numCorrect}
      totalWords={totalWords}
      markMissed={markMissed}
      showLexiconSymbols={!displayStyle.hideLexiconSymbols}
      isChallenge={isChallenge}
      challengeData={challengeData}
      numberOfRounds={numberOfRounds}
      resetTableCreator={resetTableCreator}
      tableCreatorModalSelector={tableCreatorModalSelector}
      listName={listName}
      handleStart={handleStart}
      hideErrors={hideErrors}
    />
  );
}

export default GameArea;
