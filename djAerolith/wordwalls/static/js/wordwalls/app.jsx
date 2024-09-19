import React from 'react';
import { createRoot } from 'react-dom/client';

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
    const container = document.getElementById('main-app-content');
    const root = createRoot(container);
    // Render.
    root.render(
      <WordwallsAppContainer
        username={options.username}
        listName={listName}
        autoSave={autoSave}
        lexicon={options.lexicon}
        displayStyle={style}
        tablenum={options.tablenum}
        currentHost={options.currentHost}
        defaultLexicon={options.defaultLexicon}
        challengeInfo={options.challengeInfo}
        availableLexica={options.availableLexica}
        socketServer={options.socketServer}
      />,
    );
  }
}

export default App;
