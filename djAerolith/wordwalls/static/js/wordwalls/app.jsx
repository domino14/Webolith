import React from 'react';
import ReactDOM from 'react-dom';

import Styling from './style';
import WordwallsAppContainer from './wordwalls_app_container';

class App {
  /**
   * Initialize the app.
   * @param  {Object} options
   */
  static initialize(options) {
    // WordwallsApp will be the holder of state.
    let listName;
    let autoSave;

    const style = new Styling(options.addlParams.style);
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
      <WordwallsAppContainer
        username={options.username}
        listName={listName}
        autoSave={autoSave && !options.multiplayer}
        lexicon={options.lexicon}
        displayStyle={style}
        tablenum={options.tablenum}
        tableIsMultiplayer={options.multiplayer}
        currentHost={options.currentHost}
        defaultLexicon={options.defaultLexicon}
        challengeInfo={options.challengeInfo}
        availableLexica={options.availableLexica}
        socketServer={options.socketServer}
      />,
      document.getElementById('main-app-content'),
    );
  }
}

export default App;

