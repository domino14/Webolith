define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    handleButtonClick: function() {
      if (this.props.gameGoing) {
        this.props.handleGiveup();
      } else {
        this.props.handleStart();
      }
    },
    render: function() {
      var buttonText, buttonClass;
      if (this.props.gameGoing) {
        buttonText = "Give Up";
        buttonClass = "btn btn-danger btn-sm";
      } else {
        buttonText = "Start";
        buttonClass = "btn btn-primary btn-sm";
      }

      return (
        <button
          className={buttonClass}
          onClick={this.handleButtonClick}
          style={{
            marginTop: '-4px',
          }}
        >{buttonText}</button>
      );
    }
  });
});
