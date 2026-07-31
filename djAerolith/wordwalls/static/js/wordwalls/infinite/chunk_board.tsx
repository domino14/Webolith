/**
 * @fileOverview The zoomed-in rectangle: 100 alphagrams laid out 5 wide by 20
 * tall, rendered by the existing wordwalls SVG board.
 *
 * The rectangle's shape is fixed rather than reflowed to the viewport, because
 * cell coordinates have to stay stable across a resume. On a narrow screen we
 * scale the board down instead, which is exactly what SVGBoard's scaleTransform
 * is for.
 */
import React, { useEffect, useState } from 'react';
import * as Immutable from 'immutable';

import SVGBoard from '../svg_board';
import Styling from '../style';
import { boardScale, type WallGeometry } from './geometry';
import type { ImmutableQuestion } from '../immutable-types';

// Same per-question metrics the main wordwalls board uses.
const QUESTION_WIDTH = 176;
const QUESTION_HEIGHT = 30;

interface ChunkBoardProps {
  displayStyle: Styling;
  geometry: WallGeometry;
  questions: Immutable.List<Immutable.Map<string, unknown>>;
  onShuffle: (slot: number) => void;
}

function ChunkBoard({
  displayStyle, geometry, questions, onShuffle,
}: ChunkBoardProps) {
  const BOARD_WIDTH = QUESTION_WIDTH * geometry.chunkWidth;
  const BOARD_HEIGHT = QUESTION_HEIGHT * geometry.chunkHeight;
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window === 'undefined' ? BOARD_WIDTH : window.innerWidth,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // The minimap sits below the board, so the board gets the full width. A
  // narrow viewport scales the rectangle down rather than reflowing it, because
  // it has to keep its shape or zooming in would stop showing the region you
  // clicked. On a wide monitor the player's upscale setting decides how much of
  // the extra room to use.
  const available = windowWidth - 40;
  const scaleTransform = boardScale(
    BOARD_WIDTH + 10,
    available,
    displayStyle.upscaleWithWindowSize,
    windowWidth,
  );

  return (
    <SVGBoard
      displayStyle={displayStyle}
      width={BOARD_WIDTH}
      height={BOARD_HEIGHT}
      gridWidth={geometry.chunkWidth}
      gridHeight={geometry.chunkHeight}
      scaleTransform={scaleTransform}
      questions={questions as Immutable.List<ImmutableQuestion>}
      onShuffle={onShuffle}
      isTyping={false}
    />
  );
}

// Memoized: every guess updates solvedCount on the parent, which would
// otherwise re-render all 128 questions (~2.5k SVG nodes) even when the board
// itself is unchanged. All props here are stable references or Immutable.
export default React.memo(ChunkBoard);
