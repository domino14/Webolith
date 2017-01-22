import React from 'react';
import ReactDOM from 'react-dom';

import Styling from './style';
import WordwallsApp from './wordwalls_app';

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
      <WordwallsApp
        username={options.username}
        listName={listName}
        autoSave={autoSave}
        lexicon={options.lexicon}
        displayStyle={style}
        tableUrl={`/wordwalls/table/${options.tablenum}/`}
        tablenum={options.tablenum}
        defaultLexicon={options.defaultLexicon}
        challengeInfo={options.challengeInfo}
        availableLexica={options.availableLexica}
      />,
      document.getElementById('main-app-content'));
  }
}

export default App;

