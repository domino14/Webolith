import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import $ from 'jquery';

import GameInactiveArea from './game_inactive_area';
import Styling from './style';
import SVGBoard from './svg_board';
import BuildBoard from './build_board';

class GameArea extends React.Component {
  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.gameGoing && !this.props.gameGoing) {
      // A game just started. Hide any modals.
      $('.modal').modal('hide');
    }
  }

  render() {
    let scaleTransform = 1.0;
    if (this.props.windowWidth > 1200) {
      switch (this.props.displayStyle.upscaleWithWindowSize) {
        case 'none':
          break;
        case 'small':
          scaleTransform = (this.props.windowWidth + 1200) / 2400;
          break;
        case 'large':
          scaleTransform = (this.props.windowWidth / 1200);
          break;
        default:
          break;
      }
    }
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
            scaleTransform={scaleTransform}
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
          windowWidth={this.props.windowWidth}
          questions={this.props.curQuestions}
          scaleTransform={scaleTransform}
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
        handleStart={this.props.handleStart}
        hideErrors={this.props.hideErrors}
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
    entries: PropTypes.arrayOf(PropTypes.shape({
      user: PropTypes.string,
      score: PropTypes.number,
      tr: PropTypes.number,
      w: PropTypes.number,
      addl: PropTypes.string,
    })),
    maxScore: PropTypes.number,
  }).isRequired,
  isChallenge: PropTypes.bool.isRequired,
  isBuild: PropTypes.bool.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  gridWidth: PropTypes.number.isRequired,
  gridHeight: PropTypes.number.isRequired,
  windowWidth: PropTypes.number.isRequired,
  resetTableCreator: PropTypes.func.isRequired,
  tableCreatorModalSelector: PropTypes.string.isRequired,
  listName: PropTypes.string.isRequired,
  hideErrors: PropTypes.bool.isRequired,

  handleStart: PropTypes.func.isRequired,
};

export default GameArea;
