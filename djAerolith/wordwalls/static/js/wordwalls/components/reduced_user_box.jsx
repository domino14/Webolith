import React from 'react';


const UserBox = (props) => {
  const percentScore = props.totalWords > 0 ?
    (100 * (props.numCorrect / props.totalWords)).toFixed(1) : 0;

  const fractionScore = `${props.numCorrect} / ${props.totalWords}`;

  return (
    <div>
      <span>{`${props.username}: ${percentScore}%  (${fractionScore})`}</span>
    </div>
  );
};

UserBox.propTypes = {
  numCorrect: React.PropTypes.number,
  totalWords: React.PropTypes.number,
  username: React.PropTypes.string,
};

export default UserBox;
