/**
 * @fileOverview The main Lobby view. Contains a chat area, and a list of
 * tables for the user to join.
 */

import React from 'react';

import ChatBar from './chat_bar';
import ChatBox from '../bottombar/chatbox';
import Players from './players';
import TableList from './table_list';

// Dummy static data for now.
const activeTables = [{
  tablenum: 1234567,
  admin: 'cesar',
  users: ['cesar', 'drbing', 'wanderer', 'metallica'],
  wordList: '7s (2001-3000)',
  lexicon: 'CSW15',
  secondsPerRound: 300,
  questionsPerRound: 50,
}, {
  tablenum: 2313004,
  admin: 'cats',
  users: ['dogs', 'cats', 'weezer', 'whatever'],
  wordList: 'Blank Bingos (2014-03-05)',
  lexicon: 'America',
  secondsPerRound: 240,
  questionsPerRound: 25,
},
{
  tablenum: 1234568,
  admin: 'cesar',
  users: ['cesar', 'drbing', 'wanderer', 'metallica'],
  wordList: '7s (2001-3000)',
  lexicon: 'CSW15',
  secondsPerRound: 300,
  questionsPerRound: 50,
}, {
  tablenum: 2313006,
  admin: 'cats',
  users: ['dogs', 'cats', 'weezer', 'whatever'],
  wordList: 'Blank Bingos (2014-03-05)',
  lexicon: 'America',
  secondsPerRound: 240,
  questionsPerRound: 25,
},
{
  tablenum: 12345647,
  admin: 'cesar',
  users: ['cesar', 'drbing', 'wanderer', 'metallica'],
  wordList: '7s (2001-3000)',
  lexicon: 'CSW15',
  secondsPerRound: 300,
  questionsPerRound: 50,
}, {
  tablenum: 2314404,
  admin: 'cats',
  users: ['dogs', 'cats', 'weezer', 'whatever'],
  wordList: 'Blank Bingos (2014-03-05)',
  lexicon: 'America',
  secondsPerRound: 240,
  questionsPerRound: 25,
}];

const players = [
  'cesar', 'drbing', 'wanderer', 'weezer', 'dogma', 'ozma',
];

class Lobby extends React.Component {
  foo() {
    this.bar = 3;
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-sm-12">
            <TableList
              activeTables={activeTables}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <ChatBar
              onChatSubmit={this.props.onChatSubmit}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-9">
            <ChatBox
              messages={this.props.messages}
              height={200}
            />
          </div>
          <div className="col-sm-3">
            <Players
              players={players}
              height={200}
            />
          </div>
        </div>
      </div>
    );
  }
}

Lobby.propTypes = {
  // username: React.PropTypes.string,
  onChatSubmit: React.PropTypes.func,
  messages: React.PropTypes.arrayOf(React.PropTypes.shape({
    author: React.PropTypes.string,
    id: React.PropTypes.string,
    content: React.PropTypes.string,
    type: React.PropTypes.string,
  })),
};

export default Lobby;
