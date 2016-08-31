define([
  'react',
  'jsx!reactapp/game_timer'
], function(React, GameTimer) {
  /**
   * The top bar with the various interaction buttons.
   */
  "use strict";
  var TopBar = React.createClass({
    render: function() {
      // XXX: Figure out how i18n works with React.
      // XXX: These should not be spans, and figure out how to get events.
      return (
        <div id="topBar">
          <span id="start"
                className="tableButton"
                onClick={this.props.handleStart}>Start</span>

          <GameTimer
            initialGameTime={this.props.initialGameTime}
            gameGoing={this.props.gameGoing}
          />

          <span id="giveup"
                className="tableButton"
                onClick={this.props.handleGiveup}>Give up</span>

          <span id="solutions" className="tableButton">Solutions</span>

          <span id="save" className="tableButton">Save</span>
          <input type="text" size="20" id="saveListName"/>
          <span id="customize" className="tableButton">Preferences</span>
          <span id="horSep1"></span>
          <span id="exit" className="tableButton">Exit</span>
        </div>
      );
    }
  });

  return TopBar;
});