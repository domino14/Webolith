import React from 'react';
import PropTypes from 'prop-types';

import Immutable from 'immutable';

import WordPartDisplay from './word_part_display';

const Leaderboard = (props) => {
  const leaderboard = [];
  const displayLeaderboard = [];
  // Take the map and turn it into a data structure suitable for sorting
  // and displaying as a leaderboard.
  props.answerers.forEach((answered, player) => {
    leaderboard.push({
      player,
      correct: answered.size,
      lastAnswer: answered.get(-1),
    });
  });

  leaderboard.sort((a, b) => {
    if (a.correct < b.correct) {
      return 1;
    } if (a.correct > b.correct) {
      return -1;
    }
    return 0;
  });

  const { showLexiconSymbols } = props;

  leaderboard.forEach((item) => {
    const word = item.lastAnswer;
    const lbItem = (
      <li className="list-group-item" key={item.player}>
        <div className="row">
          <div className="col-sm-3 text-info">{item.correct}</div>
          <div
            className="col-sm-9"
            style={{ whiteSpace: 'nowrap', overflowX: 'hidden' }}
          >
            {item.player}
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            Last:
            <WordPartDisplay
              text={` ${word.get('w')}${showLexiconSymbols ? word.get('s') : ''}`}
              classes="text-info small"
            />
          </div>
        </div>
      </li>
    );
    displayLeaderboard.push(lbItem);
  });

  return (
    <div className="panel panel-default">
      <div
        className="panel-body"
        style={{
          height: 300,
          overflow: 'auto',
        }}
      >
        <ul className="list-group">
          {displayLeaderboard}
        </ul>
      </div>
    </div>
  );
};

Leaderboard.propTypes = {
  answerers: PropTypes.instanceOf(Immutable.Map).isRequired,
  showLexiconSymbols: PropTypes.bool.isRequired,
};

export default Leaderboard;
