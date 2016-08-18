define([
  'react',
  'jsx!reactapp/guessbox',
  'jsx!reactapp/shufflebuttons',
  'jsx!reactapp/chatbox',
  'jsx!reactapp/guesses'
], function(React, GuessBox, ShuffleButtons, ChatBox, Guesses) {
  /**
   * The top bar with the various interaction buttons.
   */
  "use strict";
  var BottomBar = React.createClass({
    render: function() {
      // XXX: Figure out how i18n works with React.
      // XXX: These should not be spans, and figure out how to get events.
      return (
        <div id="bottomBar">
          <GuessBox/>

          <span id="horSep2"></span>

          <ShuffleButtons/>

          <div id="textBar">
            <ChatBox/>
            <Guesses/>
          </div>
        </div>
      );
    }
  });

  return BottomBar;
});