import React from 'react';

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
    return (
      <div className="row">
        <div className="col-sm-6">
          <input
            className="form-control input-sm"
            type="text"
            placeholder="Guess"
            onChange={this.handleGuessChange}
            value={this.state.guessText}
            onKeyPress={this.handleKeyPress}
            ref={ib => (this.inputBox = ib)}
            style={{
              marginTop: '-5px',
            }}
          />
        </div>
        <div className="col-sm-6">
          <span className="text-muted">
            Last: {this.props.lastGuess}
          </span>
        </div>
      </div>
    );
  }
}

GuessBox.propTypes = {
  onGuessSubmit: React.PropTypes.func,
  onHotKey: React.PropTypes.func,
  lastGuess: React.PropTypes.string,
};

export default GuessBox;
