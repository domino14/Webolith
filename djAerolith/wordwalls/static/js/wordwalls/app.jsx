import React from 'react';
import { createRoot } from 'react-dom/client';

import Styling from './style';
import WordwallsAppContainer from './wordwalls_app_container';
import { getAppropriateBackground } from './background';
import { detectDarkModePreference } from './dark_mode';
import { setupDarkModeModalObserver, applyDarkModeToExistingModals } from './modal_dark_mode';

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

    // Load the dark mode CSS with high priority
    const darkModeCss = document.createElement('link');
    darkModeCss.rel = 'stylesheet';
    darkModeCss.href = '/static/css/dark-mode.css';
    // Add it before other stylesheets for faster loading
    const firstStylesheet = document.head.querySelector('link[rel="stylesheet"]');
    if (firstStylesheet) {
      document.head.insertBefore(darkModeCss, firstStylesheet);
    } else {
      document.head.appendChild(darkModeCss);
    }

    // Check if system prefers dark mode and the user hasn't explicitly set a preference
    const systemPrefersDark = detectDarkModePreference();

    // If dark mode is enabled by database setting (highest priority),
    // or by system preference when no explicit database setting exists
    if (style.darkMode || (style.darkMode === undefined && systemPrefersDark)) {
      document.body.classList.add('dark-mode');

      // If the style doesn't explicitly have darkMode set but we're enabling it, set it
      if (!style.darkMode) {
        style.setStyleKey('darkMode', true);
      }

      // Make sure we have an appropriate background for dark mode
      style.setStyleKey('background', getAppropriateBackground(style.background, true, false));
      style.setStyleKey('bodyBackground', getAppropriateBackground(style.bodyBackground, true, true));

      // Apply dark mode to existing modals and set up observer for new ones
      setTimeout(() => {
        applyDarkModeToExistingModals();
        setupDarkModeModalObserver();
      }, 100);
    }

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
