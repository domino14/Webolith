import React from 'react';

import Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import QuestionPlaceholder from './wordwalls_question_placeholder';
import backgroundURL from './background';
import { type ImmutableQuestion } from './immutable-types';

interface SVGBoardProps {
  displayStyle: Styling;
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  scaleTransform?: number;
  questions: Immutable.List<ImmutableQuestion>;
  onShuffle: (idx: number) => void;
  isTyping: boolean;
}

function SVGBoard({
  displayStyle,
  width,
  height,
  gridWidth,
  gridHeight,
  scaleTransform = 1.0,
  questions,
  onShuffle,
  isTyping,
}: SVGBoardProps) {
  const leftMargin = 5;
  const topMargin = 4;
  const questionElements: React.ReactNode[] = [];
  const style: React.CSSProperties = {
    backgroundImage: backgroundURL(displayStyle.background),
  };

  if (displayStyle.background === 'pool_table') {
    // Stretch this one.
    style.backgroundSize = '100% 100%';
  }

  // xSize and ySize are the size that each question object takes up.
  const xSize = width / gridWidth;
  const ySize = height / gridHeight;

  // curQuestions is an Immutable List of Maps
  questions.forEach((question, idx) => {
    // Calculate top left X, Y based on dimensions.
    // Only push questions that will fit on the game board.
    const gridX = (idx % gridWidth) * xSize;
    const gridY = Math.floor(idx / gridWidth) * ySize;
    if (idx >= gridWidth * gridHeight) {
      return;
    }
    const letters = question.get('displayedAs');
    if (letters) {
      questionElements.push(
        <WordwallsQuestion
          displayStyle={displayStyle}
          letters={letters}
          key={question.get('a')}
          qNumber={idx}
          words={question.get('wMap')}
          gridX={gridX + leftMargin}
          gridY={gridY + topMargin}
          ySize={ySize}
          xSize={xSize}
          onShuffle={onShuffle}
          scaleTransform={scaleTransform}
          isTyping={isTyping}
        />,
      );
    } else {
      questionElements.push(
        <QuestionPlaceholder
          displayStyle={displayStyle}
          key={`ph${gridX},${gridY}`}
          gridX={gridX + leftMargin}
          gridY={gridY + topMargin}
          xSize={xSize}
          ySize={ySize}
          scaleTransform={scaleTransform}
        />,
      );
    }
  });

  return (
    <svg
      style={style}
      width={scaleTransform * (width + (2 * leftMargin))}
      height={scaleTransform * (height + (2 * topMargin))}
      onMouseDown={(e) => { e.preventDefault(); }}
    >
      {questionElements}
    </svg>
  );
}

export default SVGBoard;
