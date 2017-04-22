/**
 * @fileOverview The main Lobby view. Contains a chat area, and a list of
 * tables for the user to join.
 */

import React from 'react';

import ChatBar from './chat_bar';
import ChatBox from '../bottombar/chatbox';
import Players from './players';
import TableList from './table_list';

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
              activeTables={this.props.activeTables}
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
              height={120}
            />
          </div>
          <div className="col-sm-3">
            <Players
              players={this.props.users}
              height={120}
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
  users: React.PropTypes.arrayOf(React.PropTypes.string),
  activeTables: React.PropTypes.arrayOf(React.PropTypes.shape({
    tablenum: React.PropTypes.number.isRequired,
    admin: React.PropTypes.string,
    users: React.PropTypes.arrayOf(React.PropTypes.string),
    wordList: React.PropTypes.string,
    lexicon: React.PropTypes.string,
    secondsPerRound: React.PropTypes.number,
    questionsPerRound: React.PropTypes.number,
  })),
};

export default Lobby;
