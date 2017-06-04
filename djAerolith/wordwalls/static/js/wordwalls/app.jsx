import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import Styling from './style';
import WordwallsAppContainer from './containers/wordwalls_app';
import wordwallsApp from './reducers';

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
    const store = createStore(wordwallsApp);

    // Render.
    ReactDOM.render(
      <Provider store={store}>
        <WordwallsAppContainer
          username={options.username}
          listName={listName}
          autoSave={autoSave}
          lexicon={options.lexicon}
          displayStyle={style}
          tablenum={options.tablenum}
          defaultLexicon={options.defaultLexicon}
          challengeInfo={options.challengeInfo}
          availableLexica={options.availableLexica}
          socketServer={options.socketServer}
        />
      </Provider>,
      document.getElementById('main-app-content'));
  }
}

export default App;

