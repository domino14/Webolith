import React from 'react';
import Immutable from 'immutable';
import $ from 'jquery';

import GameInactiveArea from './game_inactive_area';
import Styling from './style';
import SVGBoard from './svg_board';
import BuildBoard from './build_board';


class GameArea extends React.Component {
  componentWillReceiveProps(nextProps) {
    if (nextProps.gameGoing && !this.props.gameGoing) {
      // A game just started. Hide any modals.
      $('.modal').modal('hide');
    }
  }

  render() {
    if (this.props.gameGoing) {
      if (this.props.isBuild) {
        return (
          <BuildBoard
            onShuffle={this.props.onShuffle}
            answerers={this.props.answerers}
            displayStyle={this.props.displayStyle}
            width={this.props.width}
            questions={this.props.curQuestions}
            origQuestions={this.props.origQuestions}
          />
        );
      }
      return (
        <SVGBoard
          onShuffle={this.props.onShuffle}
          displayStyle={this.props.displayStyle}
          width={this.props.width}
          height={this.props.height}
          gridWidth={this.props.gridWidth}
          gridHeight={this.props.gridHeight}
          questions={this.props.curQuestions}
        />
      );
    }

    return (
      <GameInactiveArea
        questions={this.props.origQuestions}
        numCorrect={this.props.numCorrect}
        totalWords={this.props.totalWords}
        height={this.props.height}
        markMissed={this.props.markMissed}
        showLexiconSymbols={!this.props.displayStyle.hideLexiconSymbols}
        isChallenge={this.props.isChallenge}
        challengeData={this.props.challengeData}
        numberOfRounds={this.props.numberOfRounds}
        resetTableCreator={this.props.resetTableCreator}
        tableCreatorModalSelector={this.props.tableCreatorModalSelector}
        listName={this.props.listName}
        startCountdown={this.props.startCountdown}
        startCountingDown={this.props.startCountingDown}

        canStart={this.props.canStart}
        handleStart={this.props.handleStart}
        handleStartCountdown={this.props.handleStartCountdown}
        handleStartCountdownCancel={this.props.handleStartCountdownCancel}
      />
    );
  }
}

GameArea.propTypes = {
  numberOfRounds: React.PropTypes.number,
  curQuestions: React.PropTypes.instanceOf(Immutable.List),
  origQuestions: React.PropTypes.instanceOf(Immutable.OrderedMap),
  displayStyle: React.PropTypes.instanceOf(Styling),
  totalWords: React.PropTypes.number,
  numCorrect: React.PropTypes.number,
  onShuffle: React.PropTypes.func,
  gameGoing: React.PropTypes.bool,
  markMissed: React.PropTypes.func,
  answerers: React.PropTypes.instanceOf(Immutable.Map),

  challengeData: React.PropTypes.shape({
    entries: React.PropTypes.array,
    maxScore: React.PropTypes.number,
  }),
  isChallenge: React.PropTypes.bool,
  isBuild: React.PropTypes.bool,
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  gridWidth: React.PropTypes.number,
  gridHeight: React.PropTypes.number,
  resetTableCreator: React.PropTypes.func,
  tableCreatorModalSelector: React.PropTypes.string,
  listName: React.PropTypes.string,

  startCountdown: React.PropTypes.number,
  startCountingDown: React.PropTypes.bool,

  canStart: React.PropTypes.bool,
  handleStart: React.PropTypes.func,
  handleStartCountdown: React.PropTypes.func,
  handleStartCountdownCancel: React.PropTypes.func,
};

export default GameArea;
