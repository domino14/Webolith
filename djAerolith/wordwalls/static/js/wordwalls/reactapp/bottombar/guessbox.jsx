define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    propTypes: {
      onGuessSubmit: React.PropTypes.func,
      onHotKey: React.PropTypes.func
    },
    getInitialState: function() {
      return {guessText: ''};
    },
    handleGuessChange: function(e) {
      this.setState({guessText: e.target.value});
    },
    handleKeyPress: function(e) {
      var keyCode, guess;
      keyCode = e.which || e.keyCode;
      if (keyCode === 13 || keyCode === 32) {
        // Return/Enter or Spacebar
        if (this.state.guessText.length < 1 ||
            this.state.guessText.length > 18) {
          return; // ignore
        }
        guess = this.state.guessText.trim().toUpperCase();
        this.setState({guessText: ''});
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
    },
    render: function() {
      return (
        <div className="row">
          <div className="col-sm-6">
            <input
              className="form-control input-sm"
              type="text"
              placeholder="Guess"
              onChange={this.handleGuessChange}
              value={this.state.guessText}
              onKeyPress={this.handleKeyPress} />
          </div>
          <div className="col-sm-6">
            <span className="text-muted">
              Last guess: {this.props.lastGuess}
            </span>
          </div>
        </div>
      );
    }
  });
});