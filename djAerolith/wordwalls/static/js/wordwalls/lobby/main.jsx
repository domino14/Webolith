/**
 * @fileOverview The main Lobby view. Contains a chat area, and a list of
 * tables for the user to join.
 */

import React from 'react';
import PropTypes from 'prop-types';

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
  // username: PropTypes.string,
  onChatSubmit: PropTypes.func.isRequired,
  messages: PropTypes.arrayOf(PropTypes.shape({
    author: PropTypes.string,
    id: PropTypes.string,
    content: PropTypes.string,
    type: PropTypes.string,
  })).isRequired,
  username: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.string).isRequired,
  // tables: PropTypes.arrayOf(PropTypes.shape({
  //   tablenum: PropTypes.number.isRequired,
  //   admin: PropTypes.string,
  //   users: PropTypes.arrayOf(PropTypes.string),
  //   wordList: PropTypes.string,
  //   lexicon: PropTypes.string,
  //   secondsPerRound: PropTypes.number,
  //   questionsPerRound: PropTypes.number,
  // })),
  activeTables: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onJoinClicked: PropTypes.func.isRequired,
};

export default Lobby;
