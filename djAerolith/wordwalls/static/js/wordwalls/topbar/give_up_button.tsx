import React, { useState, useEffect, useRef } from 'react';

const BUTTON_STATE_IDLE = 1;
const BUTTON_STATE_GIVEUP_TIMING_OUT = 3;

const YOU_SURE_TIMEOUT = 3000;

interface GiveUpButtonProps {
  gameGoing: boolean;
  handleGiveup: () => void;
}

function GiveUpButton({ gameGoing, handleGiveup }: GiveUpButtonProps) {
  const [buttonState, setButtonState] = useState<number>(BUTTON_STATE_IDLE);
  const youSureTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameGoing) {
      // Give the button the correct IDLE state once the game starts.
      setButtonState(BUTTON_STATE_IDLE);
    }
  }, [gameGoing]);

  const handleClickDuringGame = () => {
    if (buttonState === BUTTON_STATE_IDLE) {
      setButtonState(BUTTON_STATE_GIVEUP_TIMING_OUT);
      youSureTimeoutRef.current = window.setTimeout(() => {
        setButtonState(BUTTON_STATE_IDLE);
      }, YOU_SURE_TIMEOUT);
    } else if (buttonState === BUTTON_STATE_GIVEUP_TIMING_OUT) {
      handleGiveup();
      setButtonState(BUTTON_STATE_IDLE);
      if (youSureTimeoutRef.current) {
        window.clearTimeout(youSureTimeoutRef.current);
      }
    }
  };

  const handleButtonClick = () => {
    if (gameGoing) {
      handleClickDuringGame();
    }
  };

  if (!gameGoing) {
    return null;
  }

  let buttonText: string;
  let buttonClass: string;

  if (buttonState === BUTTON_STATE_IDLE) {
    buttonText = 'Give Up';
    buttonClass = 'btn btn-danger btn-sm';
  } else if (buttonState === BUTTON_STATE_GIVEUP_TIMING_OUT) {
    buttonText = 'Are you sure?';
    buttonClass = 'btn btn-danger btn-sm';
  } else {
    buttonText = '';
    buttonClass = '';
  }

  return (
    <button
      className={buttonClass}
      onClick={handleButtonClick}
      style={{
        marginRight: '8px',
      }}
      type="button"
    >
      {buttonText}
    </button>
  );
}

export default GiveUpButton;
