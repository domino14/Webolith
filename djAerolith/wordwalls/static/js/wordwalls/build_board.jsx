import React from 'react';
import Immutable from 'immutable';
import Styling from './style';

import WordwallsQuestion from './wordwalls_question';
import backgroundURL from './background';

const BuildBoard = (props) => {
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
  const xSize = props.width / 3;
  const ySize = props.height / 10;
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
  // questions is an Immutable List of Maps. It only has one question,
  // because we are in build mode.
  props.questions.forEach((question, idx) => {
    // Calculate top left X, Y based on dimensions.
    const gridX = props.width / 3;
    const gridY = props.height / 10;
    questions.push(
      <WordwallsQuestion
        displayStyle={questionDisplayStyle}
        letters={question.get('displayedAs')}
        key={idx}
        qNumber={idx}
        words={question.get('wMap')}
        gridX={gridX + leftMargin}
        gridY={gridY + topMargin}
        ySize={ySize}
        xSize={xSize}
        onShuffle={props.onShuffle}
      />);
  });

  return (
    <svg
      style={style}
      width={props.width + (2 * leftMargin)}
      height={props.height + (2 * topMargin)}
      onMouseDown={(e) => { e.preventDefault(); }}
    >{questions}</svg>
  );
};

BuildBoard.propTypes = {
  displayStyle: React.PropTypes.instanceOf(Styling),
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  questions: React.PropTypes.instanceOf(Immutable.List),
};

export default BuildBoard;
