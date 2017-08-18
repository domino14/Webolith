/**
 * @fileOverview The main Lobby view. Contains a chat area, and a list of
 * tables for the user to join.
 */

import React from 'react';

import ChatBar from './chat_bar';
import ChatBox from '../bottombar/chatbox';
import Players from './players';
import TableList from './table_list';

const Lobby = props => (
  <div>
    <div className="row">
      <div className="col-sm-12">
        <TableList
          activeTables={props.activeTables}
          onJoinClicked={props.onJoinClicked}
          username={props.username}
        />
      </div>
    </div>
    <div className="row">
      <div className="col-sm-9">
        <ChatBox
          messages={props.messages}
          height={120}
        />
      </div>
      <div className="col-sm-3">
        <Players
          players={props.users}
          height={120}
        />
      </div>
    </div>
    <div className="row">
      <div className="col-sm-12">
        <ChatBar
          onChatSubmit={props.onChatSubmit}
        />
      </div>
    </div>
  </div>
);


Lobby.propTypes = {
  // username: React.PropTypes.string,
  onChatSubmit: React.PropTypes.func,
  messages: React.PropTypes.arrayOf(React.PropTypes.shape({
    author: React.PropTypes.string,
    id: React.PropTypes.string,
    content: React.PropTypes.string,
    type: React.PropTypes.string,
  })),
  username: React.PropTypes.string,
  users: React.PropTypes.arrayOf(React.PropTypes.string),
  // tables: React.PropTypes.arrayOf(React.PropTypes.shape({
  //   tablenum: React.PropTypes.number.isRequired,
  //   admin: React.PropTypes.string,
  //   users: React.PropTypes.arrayOf(React.PropTypes.string),
  //   wordList: React.PropTypes.string,
  //   lexicon: React.PropTypes.string,
  //   secondsPerRound: React.PropTypes.number,
  //   questionsPerRound: React.PropTypes.number,
  // })),
  activeTables: React.PropTypes.object,  // eslint-disable-line react/forbid-prop-types
  onJoinClicked: React.PropTypes.func,
};

export default Lobby;
