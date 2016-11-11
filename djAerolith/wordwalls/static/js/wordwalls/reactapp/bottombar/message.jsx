import React from 'react';

const classMap = {
  server: 'text-muted',
  error: 'text-danger',
  chat: '',
};

const Message = props =>
  <div>
    <span className={classMap[props.type]}>{props.children}</span>
  </div>;

Message.propTypes = {
  type: React.PropTypes.string,
  children: React.PropTypes.string,
};

export default Message;

