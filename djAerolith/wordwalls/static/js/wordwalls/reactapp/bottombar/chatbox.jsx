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
        <div id="messages">{messageNodes}</div>
      );
    }
  });
});