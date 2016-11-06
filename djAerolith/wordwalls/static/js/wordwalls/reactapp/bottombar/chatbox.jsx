define([
  'react',
  'jsx!reactapp/bottombar/message'
], function(React, Message) {
  "use strict";

  const ChatBox = (props) => {
    const messageNodes = props.messages.map(message =>
      <Message
        author={message.author}
        key={message.id}
        type={message.type}
      >{message.content}</Message>);
    return (
      <div
        className="panel panel-default"
      >
        <div
          className="panel-body"
          style={{
            height: 100,
            overflow: 'auto',
          }}
          ref={(domNode) => {
            if (domNode === null) {
              return;
            }
            domNode.scrollTop = domNode.scrollHeight;
          }}
        >{messageNodes}</div>
      </div>
    );
  };

  ChatBox.propTypes = {
    messages: React.PropTypes.array,
  };

  return ChatBox;

});
