import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import backgroundURL from './background';

const SVGBoard = (props) => {
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
  const questionDisplayStyle = {
    tilesOn: props.displayStyle.tilesOn,
    tileStyle: props.displayStyle.tileStyle,
    blankCharacter: props.displayStyle.blankCharacter,
    font: props.displayStyle.font,
    showChips: props.displayStyle.showChips,
    bold: props.displayStyle.showBold,
    showBorders: props.displayStyle.showBorders,
    fontMultiplier: props.displayStyle.fontMultiplier,
    background: props.displayStyle.background,
    bodyBackground: props.displayStyle.bodyBackground,
  };
  const { onShuffle } = props;
  // curQuestions is an Immutable List of Maps
  props.questions.forEach((question, idx) => {
    // Calculate top left X, Y based on dimensions.
    const gridX = (idx % props.gridWidth) * xSize;
    const gridY = Math.floor(idx / props.gridWidth) * ySize;
    if (idx >= props.gridWidth * props.gridHeight) {
      return;
    }
    const letters = question.get('displayedAs');
    // Only push questions that will fit on the game board.
    questions.push(<WordwallsQuestion
      displayStyle={questionDisplayStyle}
      letters={letters}
      key={letters}
      qNumber={idx}
      words={question.get('wMap')}
      gridX={gridX + leftMargin}
      gridY={gridY + topMargin}
      ySize={ySize}
      xSize={xSize}
      onShuffle={onShuffle}
    />);
  });

  return (
    <svg
      style={style}
      width={props.width + (2 * leftMargin)}
      height={props.height + (2 * topMargin)}
      onMouseDown={(e) => { e.preventDefault(); }}
    >{questions}
    </svg>
  );
};

SVGBoard.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridWidth: PropTypes.number.isRequired,
  gridHeight: PropTypes.number.isRequired,
  questions: PropTypes.instanceOf(Immutable.List).isRequired,
  onShuffle: PropTypes.func.isRequired,
};

export default SVGBoard;
