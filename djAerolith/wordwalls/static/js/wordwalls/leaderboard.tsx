import React from 'react';

import * as Immutable from 'immutable';

import WordPartDisplay from './word_part_display';
import { type ImmutableWordAnswer } from './immutable-types';

interface LeaderboardItem {
  player: string;
  correct: number;
  lastAnswer: ImmutableWordAnswer | undefined;
}

interface LeaderboardProps {
  answerers: Immutable.Map<string, Immutable.List<ImmutableWordAnswer>>;
  showLexiconSymbols: boolean;
}

function Leaderboard({ answerers, showLexiconSymbols }: LeaderboardProps) {
  const leaderboard: LeaderboardItem[] = [];

  // Take the map and turn it into a data structure suitable for sorting
  // and displaying as a leaderboard.
  answerers.forEach((answered, player) => {
    leaderboard.push({
      player,
      correct: answered.size,
      lastAnswer: answered.get(-1),
    });
  });

  leaderboard.sort((a, b) => {
    if (a.correct < b.correct) {
      return 1;
    }
    if (a.correct > b.correct) {
      return -1;
    }
    return 0;
  });

  const displayLeaderboard = leaderboard.map((item) => {
    const word = item.lastAnswer;
    return (
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
            {word && (
              <WordPartDisplay
                text={` ${word.get('w')}${showLexiconSymbols ? word.get('s') : ''}`}
                classes="text-info small"
              />
            )}
          </div>
        </div>
      </li>
    );
  });

  return (
    <div className="card">
      <div
        className="card-body"
        style={{
          height: 300,
          overflow: 'auto',
        }}
      >
        <ul className="list-group">{displayLeaderboard}</ul>
      </div>
    </div>
  );
}

export default Leaderboard;
