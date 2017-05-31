import React from 'react';
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
    } else if (a.correct > b.correct) {
      return -1;
    }
    return 0;
  });
  const showLexiconSymbols = props.showLexiconSymbols;
  leaderboard.forEach((item, idx) => {
    const word = item.lastAnswer;
    displayLeaderboard.push(
      <tr key={idx}>
        <td>
          <div className="row">
            <div className="col-sm-3 text-info">{item.correct}</div>
            <div className="col-sm-9">{item.player}</div>
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
        </td>
      </tr>);
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
        <table className="table table-condensed">
          <tbody>
            {displayLeaderboard}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Leaderboard.propTypes = {
  answerers: React.PropTypes.instanceOf(Immutable.Map),
  showLexiconSymbols: React.PropTypes.bool,
};

export default Leaderboard;
