import React from 'react';
import PropTypes from 'prop-types';

const Players = (props) => {
  const playerNodes = props.players.map((player) => {
    const pNode = (
      <div
        key={player}
        style={{ whiteSpace: 'nowrap' }}
      >{player === props.currentHost ? `${player} (Host)` : player}
      </div>);
    return pNode;
  });

  return (
    <div
      className="panel panel-default"
      style={{ marginBottom: '0px' }}
    >
      <div
        className="panel-body"
        style={{
          height: props.height,
          overflow: 'auto',
        }}
      >{playerNodes}
      </div>
    </div>
  );
};

Players.propTypes = {
  players: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentHost: PropTypes.string.isRequired,
  height: PropTypes.number,
};

Players.defaultProps = {
  height: 200,
};

export default Players;
