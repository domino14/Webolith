define([
  'react',
  'jsx!reactapp/bottombar/message'
], function(React, Message) {
  "use strict";
  return React.createClass({
    render: function() {
      var messageNodes = this.props.messages.map(function(message) {
        return (
          <Message
            author={message.author}
            key={message.id}
            type={message.type}>
            {message.content}
          </Message>
        );
      });
      return (
        <div
          className="panel panel-default">
          <div
          className="panel-body"
          style={{height: 100, overflow: 'auto'}}
          ref={function(domNode) {
            if (domNode === null) {
              return;
            }
            domNode.scrollTop = domNode.scrollHeight;
          }}
          >
        {messageNodes}</div></div>
      );
    }
  });
});