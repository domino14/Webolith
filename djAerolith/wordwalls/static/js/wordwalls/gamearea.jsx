import React from 'react';
import PropTypes from 'prop-types';
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
  numberOfRounds: PropTypes.number.isRequired,
  curQuestions: PropTypes.instanceOf(Immutable.List).isRequired,
  origQuestions: PropTypes.instanceOf(Immutable.OrderedMap).isRequired,
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  totalWords: PropTypes.number.isRequired,
  numCorrect: PropTypes.number.isRequired,
  onShuffle: PropTypes.func.isRequired,
  gameGoing: PropTypes.bool.isRequired,
  markMissed: PropTypes.func.isRequired,
  answerers: PropTypes.instanceOf(Immutable.Map).isRequired,

  challengeData: PropTypes.shape({
    entries: PropTypes.array,
    maxScore: PropTypes.number,
  }).isRequired,
  isChallenge: PropTypes.bool.isRequired,
  isBuild: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridWidth: PropTypes.number.isRequired,
  gridHeight: PropTypes.number.isRequired,
  resetTableCreator: PropTypes.func.isRequired,
  tableCreatorModalSelector: PropTypes.string.isRequired,
  listName: PropTypes.string.isRequired,

  startCountdown: PropTypes.number.isRequired,
  startCountingDown: PropTypes.bool.isRequired,

  canStart: PropTypes.bool.isRequired,
  handleStart: PropTypes.func.isRequired,
  handleStartCountdown: PropTypes.func.isRequired,
  handleStartCountdownCancel: PropTypes.func.isRequired,
};

export default GameArea;
