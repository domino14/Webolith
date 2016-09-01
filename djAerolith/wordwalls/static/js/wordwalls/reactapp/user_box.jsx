define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    render: function() {
      // Need to also render the correct answers
      return (
        <div id="userBox">
          <span id="avatarLabel">{this.props.avatarLabel}</span>
          <span id="usernameLabel">{this.props.username}</span>
          <span id="pointsLabelPercent">{this.props.percentScore}</span>
          <span id="pointsLabelFraction">{this.props.fractionScore}</span>
          <div id="correctAnswers"></div>
        </div>
      );
    }
  });
});