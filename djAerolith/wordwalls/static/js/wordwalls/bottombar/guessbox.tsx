import React, {
  useState, useRef, useImperativeHandle, forwardRef,
} from 'react';

import GuessEnum from '../guess';

interface GuessBoxProps {
  onGuessSubmit: (guess: string) => void;
  onHotKey: (key: string) => void;
  lastGuess: string;
  lastGuessCorrectness: number;
}

interface GuessBoxRef {
  setFocus: () => void;
}

const GuessBox = forwardRef<GuessBoxRef, GuessBoxProps>(({
  onGuessSubmit,
  onHotKey,
  lastGuess,
  lastGuessCorrectness,
}, ref) => {
  const [guessText, setGuessText] = useState<string>('');
  const inputBoxRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    setFocus: () => {
      if (inputBoxRef.current) {
        inputBoxRef.current.focus();
      }
    },
  }));

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow letters (including unicode letters) and remove any non-letter characters
    const onlyLetters = e.target.value.replace(/[^\p{L}]/gu, '');
    setGuessText(onlyLetters);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13 || keyCode === 32) {
      // Return/Enter or Spacebar
      if (guessText.length < 1 || guessText.length > 18) {
        return; // ignore
      }
      const guess = guessText.trim().toUpperCase();
      setGuessText('');
      onGuessSubmit(guess);
    } else if (keyCode === 49) {
      onHotKey('1');
      e.preventDefault();
    } else if (keyCode === 50) {
      onHotKey('2');
      e.preventDefault();
    } else if (keyCode === 51) {
      onHotKey('3');
      e.preventDefault();
    }
  };

  let guessClass: string;
  let guessStyle: React.CSSProperties = {};
  
  switch (lastGuessCorrectness) {
    case GuessEnum.INCORRECT:
      guessClass = 'text-danger';
      break;
    case GuessEnum.CORRECT:
      guessClass = 'text-success';
      break;
    case GuessEnum.ALREADYGUESSED:
      guessClass = 'text-warning';
      break;
    case GuessEnum.INCORRECT_LEXICON_SYMBOL:
      guessClass = 'text-primary';
      break;
    case GuessEnum.PENDING:
      // Waiting for server response - use a slightly less green version of success color
      guessClass = '';
      guessStyle = { 
        color: 'var(--bs-success)', 
        opacity: 0.8 
      }; // Use CSS custom property with opacity for dark/light mode compatibility
      break;
    default:
      guessClass = 'text-muted';
  }

  return (
    <div className="row">
      <div className="col-7 col-sm-6">
        <input
          className="form-control"
          type="text"
          placeholder="Guess"
          spellCheck="false"
          onChange={handleGuessChange}
          value={guessText}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          onKeyPress={handleKeyPress}
          ref={inputBoxRef}
          style={{
            marginTop: '-5px',
          }}
        />
      </div>
      <div className="d-none d-sm-block col-sm-6">
        <span className="text-muted">
          Last:
        </span>
        {' '}
        <strong className={guessClass} style={guessStyle}>{lastGuess}</strong>
      </div>
      <div className="col-5 d-inline-block d-sm-none">
        <strong className={guessClass} style={guessStyle}>
          {lastGuess}
        </strong>
      </div>
    </div>
  );
});

GuessBox.displayName = 'GuessBox';

export default GuessBox;
export type { GuessBoxRef };
