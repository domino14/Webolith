import React from 'react';
import Immutable from 'immutable';

import WordwallsQuestion from './wordwalls_question';
import Solutions from './solutions';
import Styling from './style';
import SVGBoard from './svg_board';

class GameBoard extends React.Component {
  render() {
    const questions = [];
    // xSize and ySize are the size that each question object takes
    // up.
    const xSize = this.props.width / this.props.gridWidth;
    const ySize = this.props.height / this.props.gridHeight;
    const questionDisplayStyle = {
      tilesOn: this.props.displayStyle.tilesOn,
      tileStyle: this.props.displayStyle.tileStyle,
      blankCharacter: this.props.displayStyle.blankCharacter,
      font: this.props.displayStyle.font,
      showChips: this.props.displayStyle.showChips,
      bold: this.props.displayStyle.showBold,
      showBorders: this.props.displayStyle.showBorders,
    };
    // curQuestions is an Immutable List of Maps
    this.props.curQuestions.forEach((question, idx) => {
      // Calculate top left X, Y based on dimensions.
      const gridX = (idx % this.props.gridWidth) * xSize;
      const gridY = Math.floor(idx / this.props.gridWidth) * ySize;
      if (idx >= this.props.gridWidth * this.props.gridHeight) {
        return;
      }
      // Only push questions that will fit on the game board.
      questions.push(
        <WordwallsQuestion
          displayStyle={questionDisplayStyle}
          letters={question.get('displayedAs')}
          key={idx}
          qNumber={idx}
          words={question.get('wMap')}
          gridX={gridX}
          gridY={gridY}
          ySize={ySize}
          xSize={xSize}
          onShuffle={this.props.onShuffle}
        />);
    });

    if (this.props.gameGoing || this.props.numberOfRounds === 0) {
      return (
        // Prevent default on mouse down to prevent taking focus in
        // case of misclick.
        <SVGBoard
          background={this.props.displayStyle.background}
          width={this.props.width}
          height={this.props.height}
        >{questions}</SVGBoard>
      );
    }

    return (
      <Solutions
        questions={this.props.origQuestions}
        answeredByMe={this.props.answeredByMe}
        totalWords={this.props.totalWords}
        height={this.props.height}
        markMissed={this.props.markMissed}
        showLexiconSymbols={!this.props.displayStyle.hideLexiconSymbols}
      />
    );
  }
}

GameBoard.propTypes = {
  numberOfRounds: React.PropTypes.number,
  curQuestions: React.PropTypes.instanceOf(Immutable.List),
  origQuestions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  displayStyle: React.PropTypes.instanceOf(Styling),
  totalWords: React.PropTypes.number,
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  onShuffle: React.PropTypes.func,
  gameGoing: React.PropTypes.bool,
  markMissed: React.PropTypes.func,

  width: React.PropTypes.number,
  height: React.PropTypes.number,
  gridWidth: React.PropTypes.number,
  gridHeight: React.PropTypes.number,
};

export default GameBoard;
