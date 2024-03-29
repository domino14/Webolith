import React from 'react';
import PropTypes from 'prop-types';

import Message from './message';

function ChatBox(props) {
  const messageNodes = props.messages.map((message) => (
    <Message
      author={message.author}
      key={message.id}
      type={message.type}
    >
      {message.content}
    </Message>
  ));
  return (
    <div
      className="panel panel-default"
      style={{ marginBottom: '2px' }}
    >
      <div
        className="panel-body"
        style={{
          height: props.height,
          overflow: 'auto',
        }}
        ref={(domNode) => {
          if (domNode === null) {
            return;
          }
          domNode.scrollTop = domNode.scrollHeight; // eslint-disable-line no-param-reassign
        }}
      >
        {messageNodes}
      </div>
    </div>
  );
}

ChatBox.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.shape({
    author: PropTypes.string,
    id: PropTypes.string,
    content: PropTypes.string,
    type: PropTypes.string,
  })).isRequired,
  height: PropTypes.number,
};

ChatBox.defaultProps = {
  height: 100,
};

export default ChatBox;
