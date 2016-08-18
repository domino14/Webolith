define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      return (
        <div>
          <label htmlFor="guessText">Guess: </label>
          <input type="text" name="Guess" size="15" id="guessText"/>
        </div>
      );
    }
  });
});