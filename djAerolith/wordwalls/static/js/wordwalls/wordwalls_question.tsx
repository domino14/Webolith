import React from 'react';

import * as Immutable from 'immutable';

import Styling from './style';
import Chip from './game_chip';
import Tile from './game_tile';
import QuestionText from './question_text';

const DEFAULT_BLANK_CHARACTER = '?';

const getRandomInt = (max: number): number => Math.floor(Math.random() * Math.floor(max));

/**
 * Get the dimensions of a tile given the length of the word.
 */
function getTileDimensions(length: number, chipAdded: boolean): [number, number] {
  let newLength = length;
  if (chipAdded === true) {
    newLength = length + 1;
  }
  if (newLength <= 8) {
    return [19, 19];
  }
  const dimensionsMap: Record<number, [number, number]> = {
    9: [18, 18],
    10: [16.75, 16.75],
    11: [15.25, 15.25],
    12: [14, 14],
    13: [13, 13],
    14: [12, 12],
    15: [11.25, 11.25],
    // Only when a chip is added.
    16: [10.5, 10.5],
  };
  return dimensionsMap[newLength];
}

interface WordwallsQuestionProps {
  displayStyle: Styling;
  letters: string;
  qNumber: number;
  words: Immutable.Map<string, unknown>;
  gridX: number;
  gridY: number;
  xSize: number;
  ySize: number;
  onShuffle: (qNumber: number) => void;
  scaleTransform?: number;
  isTyping: boolean;
}

function WordwallsQuestion({
  displayStyle,
  letters = '',
  qNumber,
  words,
  gridX,
  gridY,
  xSize,
  ySize,
  onShuffle,
  scaleTransform = 1.0,
  isTyping,
}: WordwallsQuestionProps) {
  const clickedQ = () => {
    onShuffle(qNumber);
  };

  /**
   * Draw a rectangular border, that may have a stroke of 0px (hidden)
   */
  const borderRectangle = () => (
    <rect
      width={xSize}
      height={ySize}
      x={gridX}
      y={gridY}
      stroke="#7e7f7a"
      strokeWidth="1px"
      fill="none"
      strokeOpacity={displayStyle.showBorders ? '1' : '0'}
    />
  );

  const tiles: React.ReactElement[] = [];

  const dims = getTileDimensions(letters.length, displayStyle.showChips);
  const tileWidth = dims[0];
  const tileHeight = dims[1];
  const heightPct = tileHeight / ySize;

  const y = gridY + (ySize * ((1 - heightPct) / 2));
  const xPadding = gridX + 0.5;
  // XXX: This is a bit of an ugly formula, but it's fast.
  // See http://stackoverflow.com/a/22580176/1737333 for perhaps
  // a better approach.
  const letterFontSize = dims[0] * 7;
  const numberFontSize = dims[0] * 5;
  let countFrom = 0;
  // don't show chips for "typing" quizzes.
  if (displayStyle.showChips && !isTyping) {
    tiles.push(
      <Chip
        radius={tileWidth / 2 - 1}
        x={xPadding + 0.5}
        y={y + 0.5}
        fontSize={numberFontSize}
        number={words.size}
        key={`q${qNumber}chip`}
      />,
    );
    countFrom = 1;
  }
  let x: number;
  let letter: string;
  const strokeWidth = 0.6;
  const randomOrientation = false; // TODO: Re-enable randomTileOrientation feature
  if (displayStyle.tilesOn) {
    for (let i = countFrom, letterIdx = 0; i < letters.length + countFrom; i += 1, letterIdx += 1) {
      x = xPadding + i * (tileWidth + strokeWidth);
      letter = letters[letterIdx];
      if (letter === DEFAULT_BLANK_CHARACTER && displayStyle.blankCharacter !== '') {
        letter = displayStyle.blankCharacter;
      }
      let angle = 0;
      if (randomOrientation) {
        angle = getRandomInt(4) * 90;
      }
      tiles.push(
        <Tile
          tileStyle={displayStyle.tileStyle}
          font={displayStyle.font}
          bold={displayStyle.showBold}
          key={`q${qNumber}tile${letterIdx}`}
          x={x}
          y={y}
          strokeWidth={strokeWidth}
          width={tileWidth}
          height={tileHeight}
          fontSize={letterFontSize * displayStyle.fontMultiplier}
          letter={letter}
          angle={angle}
        />,
      );
    }
  } else {
    // Tiles are off, just use a <text>
    tiles.push(
      <QuestionText
        font={displayStyle.font}
        bold={displayStyle.showBold}
        key={`q${qNumber}qtext`}
        x={xPadding + countFrom * (tileWidth + 1)}
        y={gridY + ySize / 2}
        fontSize={letterFontSize * 1.2 * displayStyle.fontMultiplier}
        letters={letters}
        background={displayStyle.background}
        bodyBackground={displayStyle.bodyBackground}
      />,
    );
  }

  return (
    <g
      onMouseDown={/* disallow highlighting text */ (e) => e.preventDefault()}
      onClick={clickedQ}
      style={{
        cursor: 'default',
      }}
      transform={`scale(${scaleTransform})`}
    >
      {tiles}
      {borderRectangle()}
    </g>
  );
}

export default WordwallsQuestion;
