import React from 'react';
import Immutable from 'immutable';


const UserBox = (props) => {
  const percentScore = props.totalWords > 0 ?
    (100 * (props.answeredByMe.length / props.totalWords)).toFixed(1) : 0;

  const fractionScore = `${props.answeredByMe.length} / ${props.totalWords}`;

  return (
    <div>
      <span>{`${props.username}: ${percentScore}%  (${fractionScore})`}</span>
    </div>
  );
};

UserBox.propTypes = {
  answeredByMe: React.PropTypes.arrayOf(
    React.PropTypes.instanceOf(Immutable.Map)),
  totalWords: React.PropTypes.number,
  username: React.PropTypes.string,
  // isBuild: React.PropTypes.bool,
};

export default UserBox;
