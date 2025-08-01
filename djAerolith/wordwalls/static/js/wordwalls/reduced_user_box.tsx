import React from 'react';

interface UserBoxProps {
  numCorrect: number;
  totalWords: number;
  username: string;
}

function UserBox({ numCorrect, totalWords, username }: UserBoxProps) {
  const percentScore = totalWords > 0 ? (100 * (numCorrect / totalWords)).toFixed(1) : 0;

  const fractionScore = `${numCorrect} / ${totalWords}`;

  return (
    <div>
      <span>{`${username}: ${percentScore}%  (${fractionScore})`}</span>
    </div>
  );
}

export default UserBox;
