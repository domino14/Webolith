import React from 'react';

const classMap = {
  server: 'text-muted',
  error: 'text-danger',
  info: 'text-info',
  chat: '',
};

const Message = (props) => {
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
};

Message.propTypes = {
  type: React.PropTypes.string,
  children: React.PropTypes.string,
  author: React.PropTypes.string,
};

export default Message;

