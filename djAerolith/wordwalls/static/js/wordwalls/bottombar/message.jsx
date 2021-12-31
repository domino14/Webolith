import React from 'react';
import PropTypes from 'prop-types';

const classMap = {
  server: 'text-muted',
  error: 'text-danger',
  info: 'text-info',
  chat: '',
};

function Message(props) {
  let contents;
  if (props.type === 'chat') {
    contents = `${props.author}: ${props.children}`;
  } else {
    contents = props.children;
  }
  return (
    <div>
      <span className={classMap[props.type]}>{contents}</span>
    </div>
  );
}

Message.propTypes = {
  type: PropTypes.string.isRequired,
  children: PropTypes.string.isRequired,
  author: PropTypes.string,
};

Message.defaultProps = {
  author: '',
};

export default Message;
