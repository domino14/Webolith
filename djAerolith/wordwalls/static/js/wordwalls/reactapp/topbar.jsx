define([
  'react'
], function(React) {
  /**
   * The top bar with the various interaction buttons.
   */
  var TopBar = React.createClass({
    render: function() {
      // XXX: Figure out how i18n works with React.
      // XXX: These should not be spans, and figure out how to get events.
      return (
        <div id="topBar">
          <span id="start" className="tableButton">Start</span>
          <span id="gameTimer"> : </span>
          <span id="giveup" className="tableButton">Give up</span>
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