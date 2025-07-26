import React from 'react';

const classMap = {
  server: 'text-muted',
  error: 'text-danger',
  info: 'text-info',
  chat: '',
} as const;

type MessageType = keyof typeof classMap;

interface MessageProps {
  type: MessageType;
  children: string;
  author?: string;
}

function Message({ type, children, author = '' }: MessageProps) {
  let contents: string;
  if (type === 'chat') {
    contents = `${author}: ${children}`;
  } else {
    contents = children;
  }
  return (
    <div>
      <span className={classMap[type]}>{contents}</span>
    </div>
  );
}

export default Message;
