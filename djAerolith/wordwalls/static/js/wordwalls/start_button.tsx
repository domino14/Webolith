/**
 * @fileOverview The actual Start button.
 */
import React from 'react';

interface StartButtonProps {
  handleButtonClick: () => void;
  buttonText: string;
  buttonClass: string;
}

function StartButton({
  handleButtonClick,
  buttonText,
  buttonClass,
}: StartButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={handleButtonClick}
      style={{
        marginTop: '-6px',
      }}
    >
      {buttonText}
    </button>
  );
}

export default StartButton;
