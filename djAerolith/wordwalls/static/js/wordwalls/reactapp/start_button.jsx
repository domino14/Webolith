define([
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
    /**
     * Handle the start click event.
     */
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
});