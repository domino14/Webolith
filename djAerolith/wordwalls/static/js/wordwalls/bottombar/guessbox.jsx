import React from 'react';
import PropTypes from 'prop-types';

class GuessBox extends React.Component {
  constructor() {
    super();
    this.state = {
      guessText: '',
    };
    this.handleGuessChange = this.handleGuessChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  setFocus() {
    this.inputBox.focus();
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
      if (this.state.guessText.length < 1 ||
          this.state.guessText.length > 18) {
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

  render() {
    let guessClass = 'text-muted';
    if (this.props.lastGuessCorrectness === false) {
      guessClass = 'text-danger';
    }
    return (
      <div className="row">
        <div className="col-xs-7 col-sm-6">
          <input
            className="form-control"
            type="text"
            placeholder="Guess"
            onChange={this.handleGuessChange}
            value={this.state.guessText}
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
          </span> <span className={guessClass}>{this.props.lastGuess}</span>
        </div>
        <div className="col-xs-5 visible-xs-inline-block">
          <span className={guessClass}>
            {this.props.lastGuess}
          </span>
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
  lastGuessCorrectness: PropTypes.bool.isRequired,
};

export default GuessBox;
