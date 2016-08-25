/*global JSON*/
define([
  'react',
  'react-dom',
  'jsx!reactapp/wordwalls_app'
], function(React, ReactDOM, WordwallsApp) {
  "use strict";
  var App = function() {};

  /**
   * Initialize the app.
   * @param  {Object} options
   */
  App.prototype.initialize = function(options) {
    // WordwallsApp will be the holder of state.
    var style, topClassName;
    console.log(options.addlParams);
    topClassName = '';

    if (options.addlParams.style != null) {
      style = JSON.parse(options.addlParams.style);
    } else {
      style = {};
    }
    // Render.
    ReactDOM.render(
      <WordwallsApp
        saveName={options.addlParams.saveName}
        lexicon={options.lexicon}
        displayStyle={style}
        tableUrl={'/wordwalls/table/' + options.tablenum + '/'}
      />,
      document.getElementById('main-app-content')
    );
  };

  return App;
});