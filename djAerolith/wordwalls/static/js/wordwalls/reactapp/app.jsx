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
    var style, topClassName, listName, autoSave;
    console.log('addl params', options.addlParams);
    topClassName = '';

    if (options.addlParams.style != null) {
      style = JSON.parse(options.addlParams.style);
    } else {
      style = {};
    }
    // Get the list name from one of two places.
    if (options.addlParams.saveName) {
      listName = options.addlParams.saveName;
      autoSave = true;
    } else {
      listName = options.addlParams.tempListName;
      autoSave = false;
    }
    // Render.
    ReactDOM.render(
      <WordwallsApp
        listName={listName}
        autoSave={autoSave}
        lexicon={options.lexicon}
        displayStyle={style}
        tableUrl={'/wordwalls/table/' + options.tablenum + '/'}
      />,
      document.getElementById('main-app-content')
    );
  };

  return App;
});