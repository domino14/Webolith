import React from 'react';

const Players = (props) => {
  const playerNodes = props.players.map((player, idx) =>
    <div
      key={idx}
      style={{ whiteSpace: 'nowrap' }}
    >{player === props.currentHost ? `${player} (Host)` : player}
    </div>);
  return (
    <div
      className="panel panel-default"
      style={{ marginBottom: '0px' }}
    >
      <div
        className="panel-body"
        style={{
          height: props.height || 200,
          overflow: 'auto',
        }}
      >{playerNodes}</div>
    </div>
  );
};

Players.propTypes = {
  players: React.PropTypes.arrayOf(React.PropTypes.string),
  currentHost: React.PropTypes.string,
  height: React.PropTypes.number,
};

export default Players;
