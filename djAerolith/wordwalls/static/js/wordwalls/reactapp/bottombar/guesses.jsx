define([
  'react'
], function(React) {
  "use strict";

  return React.createClass({
    render: function() {
      var guesses;
      guesses = [];
      this.props.guesses.forEach(function(guess, idx) {
        guesses.push(
          <div key={idx}>
            <small
              className="text-muted">{guess}</small>
          </div>
        );
      });
      return (
        <div
          className="well well-sm"
          style={{height: 100, overflow: 'auto'}}>
          <h5>Guesses:</h5>
            {guesses}
        </div>
      );
    }
  });
});