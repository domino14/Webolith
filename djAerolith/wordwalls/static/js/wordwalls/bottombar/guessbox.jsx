import React from 'react';
import PropTypes from 'prop-types';

import GuessEnum from '../guess';

class GuessBox extends React.Component {
  constructor() {
    super();
    this.state = {
      guessText: '',
    };
    this.handleGuessChange = this.handleGuessChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  handleGuessChange(e) {
    this.setState({
      guessText: e.target.value,
    });
  }

  handleKeyPress(e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13 || keyCode === 32) {
      // Return/Enter or Spacebar
      if (this.state.guessText.length < 1
          || this.state.guessText.length > 18) {
        return; // ignore
      }
      const guess = this.state.guessText.trim().toUpperCase();
      this.setState({
        guessText: '',
      });
      this.props.onGuessSubmit(guess);
    } else if (keyCode === 49) {
      this.props.onHotKey('1');
      e.preventDefault();
    } else if (keyCode === 50) {
      this.props.onHotKey('2');
      e.preventDefault();
    } else if (keyCode === 51) {
      this.props.onHotKey('3');
      e.preventDefault();
    }
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  setFocus() {
    this.inputBox.focus();
  }

  render() {
    let guessClass;
    switch (this.props.lastGuessCorrectness) {
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
      default:
        guessClass = 'text-muted';
    }

    return (
      <div className="row">
        <div className="col-xs-7 col-sm-6">
          <input
            className="form-control"
            type="text"
            placeholder="Guess"
            spellCheck="false"
            onChange={this.handleGuessChange}
            value={this.state.guessText}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            onKeyPress={this.handleKeyPress}
            // onBlur={this.props.onBlur}
            ref={(ib) => {
              this.inputBox = ib;
            }}
            style={{
              marginTop: '-5px',
            }}
          />
        </div>
        <div className="hidden-xs col-sm-6">
          <span className="text-muted">
            Last:
          </span>
          {' '}
          <strong className={guessClass}>{this.props.lastGuess}</strong>
        </div>
        <div className="col-xs-5 visible-xs-inline-block">
          <strong className={guessClass}>
            {this.props.lastGuess}
          </strong>
        </div>
      </div>
    );
  }
}

GuessBox.propTypes = {
  onGuessSubmit: PropTypes.func.isRequired,
  // onBlur: PropTypes.func.isRequired,
  onHotKey: PropTypes.func.isRequired,
  lastGuess: PropTypes.string.isRequired,
  lastGuessCorrectness: PropTypes.number.isRequired,
};

export default GuessBox;
