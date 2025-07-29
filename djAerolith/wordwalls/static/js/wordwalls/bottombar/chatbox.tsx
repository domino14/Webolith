import React from 'react';

import Message from './message';

interface ChatMessage {
  author?: string;
  id: string;
  content: string;
  type: string;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  height?: number;
}

function ChatBox({ messages, height = 100 }: ChatBoxProps) {
  const messageNodes = messages.map((message) => (
    <Message
      author={message.author}
      key={message.id}
      type={message.type as 'server' | 'error' | 'info' | 'chat'}
    >
      {message.content}
    </Message>
  ));

  return (
    <div
      className="card"
      style={{ marginBottom: '2px' }}
    >
      <div
        className="card-body"
        style={{
          height,
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

export default ChatBox;
