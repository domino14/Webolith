/**
 * @fileOverview The actual Start button.
 */
import React from 'react';

interface StartButtonProps {
  handleButtonClick: () => void;
  buttonText: string;
  buttonClass: string;
  disabled?: boolean;
  title?: string;
}

function StartButton({
  handleButtonClick,
  buttonText,
  buttonClass,
  disabled = false,
  title,
}: StartButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass}
      onClick={handleButtonClick}
      disabled={disabled}
      title={title}
      style={{
        marginTop: '-6px',
      }}
    >
      {buttonText}
    </button>
  );
}

export default StartButton;
