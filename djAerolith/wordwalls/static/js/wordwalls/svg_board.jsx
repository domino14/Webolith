import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import QuestionPlaceholder from './wordwalls_question_placeholder';
import backgroundURL from './background';

function SVGBoard(props) {
  const leftMargin = 5;
  const topMargin = 4;
  const questions = [];
  const style = {
    backgroundImage: backgroundURL(props.displayStyle.background),
  };
  if (props.displayStyle.background === 'pool_table') {
    // Stretch this one.
    style.backgroundSize = '100% 100%';
  }

  // xSize and ySize are the size that each question object takes
  // up.
  const xSize = props.width / props.gridWidth;
  const ySize = props.height / props.gridHeight;
  const { onShuffle } = props;

  // curQuestions is an Immutable List of Maps
  props.questions.forEach((question, idx) => {
    // Calculate top left X, Y based on dimensions.
    // Only push questions that will fit on the game board.
    const gridX = (idx % props.gridWidth) * xSize;
    const gridY = Math.floor(idx / props.gridWidth) * ySize;
    if (idx >= props.gridWidth * props.gridHeight) {
      return;
    }
    const letters = question.get('displayedAs');
    if (letters) {
      questions.push(<WordwallsQuestion
        displayStyle={props.displayStyle}
        letters={letters}
        key={question.get('a')}
        qNumber={idx}
        words={question.get('wMap')}
        gridX={gridX + leftMargin}
        gridY={gridY + topMargin}
        ySize={ySize}
        xSize={xSize}
        onShuffle={onShuffle}
        scaleTransform={props.scaleTransform}
        isTyping={props.isTyping}
      />);
    } else {
      questions.push(<QuestionPlaceholder
        displayStyle={props.displayStyle}
        key={`ph${gridX},${gridY}`}
        gridX={gridX + leftMargin}
        gridY={gridY + topMargin}
        xSize={xSize}
        ySize={ySize}
        scaleTransform={props.scaleTransform}
      />);
    }
  });

  return (
    <svg
      style={style}
      width={props.scaleTransform * (props.width + (2 * leftMargin))}
      height={props.scaleTransform * (props.height + (2 * topMargin))}
      onMouseDown={(e) => { e.preventDefault(); }}
    >
      {questions}
    </svg>
  );
}

SVGBoard.defaultProps = {
  scaleTransform: 1.0,
};

SVGBoard.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridWidth: PropTypes.number.isRequired,
  gridHeight: PropTypes.number.isRequired,
  scaleTransform: PropTypes.number,
  questions: PropTypes.instanceOf(Immutable.List).isRequired,
  onShuffle: PropTypes.func.isRequired,
  isTyping: PropTypes.bool.isRequired,
};

export default SVGBoard;
