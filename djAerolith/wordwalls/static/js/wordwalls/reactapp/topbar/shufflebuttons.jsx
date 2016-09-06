define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      return (
        <div>
          <span id="shuffle" className="utilityButton">Shuffle (1)</span>
          <span id="alphagram" className="utilityButton">Alphagram (2)</span>
          <span id="customOrder" className="utilityButton">Custom (3)</span>
        </div>
      );
    }
  });
});