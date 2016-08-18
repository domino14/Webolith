define([
  'react',
  'react-dom',

  'jsx!reactapp/topbar',
  'jsx!reactapp/gameboard',
  'jsx!reactapp/bottombar',

  'reactapp/test_initial_state'

], function(React, ReactDOM, TopBar, GameBoard, BottomBar, initialState) {
  "use strict";
  var App = function() {};

  App.prototype.initialize = function() {
    var WordwallsApp = React.createClass({
      render: function() {
        return (
          <div>
            <TopBar/>
            <div id="encloser">
              <GameBoard questions={this.props.questions} />
            </div>
            <BottomBar/>
          </div>
        );
      }
    });
    // Render the actual static board.
    // XXX: This will be replaced by state from the backend.
    ReactDOM.render(
      <WordwallsApp questions={initialState.questions} />,
      document.getElementById('main-app-content')
    );

  };
  return App;
});