import React from 'react';
// omg eslint
const Table = (props) => {
  let button;
  let lock;
  const userInTable = props.users.includes(props.username);
  const joinButton = (
    <button
      className="btn btn-info"
      onClick={() => props.onJoinClicked(props.tablenum)}
    >Join</button>);
  if (props.multiplayer) {
    if (!userInTable) {
      button = joinButton;
    }
  } else {
    lock = (
      <span className="glyphicon glyphicon-lock" aria-hidden="true" />);
    if (!userInTable && props.host === props.username) {
      button = joinButton;
    }
  }
  return (
    <li className="list-group-item">
      <div className="row">
        <div className="col-sm-2">
          Table {props.tablenum} {lock}
        </div>
        <div className="col-sm-3">
          <b>{props.lexicon}</b>
        </div>
        <div className="col-sm-4">
          <span className="text-muted">Host: {props.host}</span>
        </div>
        <div className="col-sm-3">
          {button}
        </div>
      </div>
      <div className="row">
        <div className="col-sm-4">
          List: <span className="text-info">{props.wordList}</span>
        </div>
        <div className="col-sm-4">
          <span className="text-muted">In table: {props.users.join(' ')}</span>
        </div>
      </div>
    </li>
  );
};

Table.propTypes = {
  tablenum: React.PropTypes.number,
  lexicon: React.PropTypes.string,
  wordList: React.PropTypes.string,
  host: React.PropTypes.string,
  users: React.PropTypes.arrayOf(React.PropTypes.string),
  onJoinClicked: React.PropTypes.func,
  multiplayer: React.PropTypes.bool,
  username: React.PropTypes.string,
};

export default Table;
