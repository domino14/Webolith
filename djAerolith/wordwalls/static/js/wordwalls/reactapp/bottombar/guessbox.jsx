define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    propTypes: {
      onGuessSubmit: React.PropTypes.func
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
        // XXX: Only submit guess if not solved locally, i.e.
        // see old logic.
        this.props.onGuessSubmit(guess);
      }
      // XXX: Handle shuffle/alphagram/etc
    },
    render: function() {
      return (
        <input
          className="form-control input-sm"
          type="text"
          placeholder="Guess"
          onChange={this.handleGuessChange}
          value={this.state.guessText}
          onKeyPress={this.handleKeyPress} />
      );
    }
  });
});