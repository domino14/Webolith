define([
  'react'
], function(React) {
  "use strict";

  return React.createClass({
    render: function() {
      return (
        <div>
          <span>Guesses:</span>
          <div id="guesses"></div>
        </div>
      );
    }
  });
});