import React from 'react';
import PropTypes from 'prop-types';

function UserBox(props) {
  const percentScore = props.totalWords > 0
    ? (100 * (props.numCorrect / props.totalWords)).toFixed(1) : 0;

  const fractionScore = `${props.numCorrect} / ${props.totalWords}`;

  return (
    <div>
      <span>{`${props.username}: ${percentScore}%  (${fractionScore})`}</span>
    </div>
  );
}

UserBox.propTypes = {
  numCorrect: PropTypes.number.isRequired,
  totalWords: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
  // isBuild: PropTypes.bool,
};

export default UserBox;
