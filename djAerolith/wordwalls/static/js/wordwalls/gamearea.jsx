import React from 'react';
import Immutable from 'immutable';

import GameInactiveArea from './game_inactive_area';
import Styling from './style';
import SVGBoard from './svg_board';

const GameArea = (props) => {
  if (props.gameGoing) {
    return (
      // Prevent default on mouse down to prevent taking focus in
      // case of misclick.
      <SVGBoard
        onShuffle={props.onShuffle}
        displayStyle={props.displayStyle}
        width={props.width}
        height={props.height}
        gridWidth={props.gridWidth}
        gridHeight={props.gridHeight}
        questions={props.curQuestions}
      />
    );
  }

  return (
    <GameInactiveArea
      questions={props.origQuestions}
      answeredByMe={props.answeredByMe}
      totalWords={props.totalWords}
      height={props.height}
      markMissed={props.markMissed}
      showLexiconSymbols={!props.displayStyle.hideLexiconSymbols}
      isChallenge={props.isChallenge}
      challengeData={props.challengeData}
      numberOfRounds={props.numberOfRounds}
      resetTableCreator={props.resetTableCreator}
      tableCreatorModalSelector={props.tableCreatorModalSelector}
      listName={props.listName}
    />
  );
};

GameArea.propTypes = {
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

  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
  isChallenge: React.PropTypes.bool,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  gridWidth: React.PropTypes.number,
  gridHeight: React.PropTypes.number,
  resetTableCreator: React.PropTypes.func,
  tableCreatorModalSelector: React.PropTypes.string,
  listName: React.PropTypes.string,
};

export default GameArea;
