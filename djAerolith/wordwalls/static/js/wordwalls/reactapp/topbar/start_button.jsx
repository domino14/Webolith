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
        >{buttonText}</button>
      );
    }
  });
});
/*define([
  'react'
], function(React) {

  "use strict";
  var StartButton = React.createClass({
    render: function() {
      return (
        <span id="start" className="tableButton"
          onClick={this.props.onStartDesired}>Start</span>
      );
    },

    handleClick: function() {
      $.ajax({
        url: this.props.tableUrl,
        method: 'POST',
        dataType: 'json',
        data: {action: 'start'}
      })
      .done(this.handleStart)
      .error(this.handleError);
    },

    handleStart: function(data) {
      if (this.props.gameGoing) {
        return;
      }
      if (_.has(data, 'serverMsg')) {

      }
      if (_.has(data, 'error')) {

      }
      if (_.has(data, 'questions')) {

      }
      if (_.has(data, 'time')) {

      }
      if (_.has(data, 'gameType')) {

      }
      console.log(data);
      console.log(this.handleClick);
    },

    handleError: function(jqXHR) {

    }
  });

  return StartButton;
});*/