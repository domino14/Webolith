import React from 'react';
import { createRoot } from 'react-dom/client';

import Styling from './style';
import WordwallsAppContainer from './wordwalls_app_container';
import { getAppropriateBackground } from './background';
import { detectDarkModePreference, setTheme } from './dark_mode';

interface ChallengeInfo {
  id?: number;
  lexicon?: string;
  numQuestions?: number;
  seconds?: number;
  timeCreated?: string;
  createdBy?: string;
  name?: string;
  description?: string;
}

interface AvailableLexicon {
  lexicon: string;
  description: string;
  lengthCounts: Record<string, number>;
  wordCount: number;
}

interface AppOptions {
  username: string;
  lexicon: string;
  defaultLexicon: number;
  tablenum: number;
  currentHost: string;
  challengeInfo: ChallengeInfo[];
  availableLexica: AvailableLexicon[];
  addlParams: {
    style: Record<string, unknown>;
    saveName?: string;
    tempListName?: string;
  };
}

class App {
  /**
   * Initialize the app.
   */
  static initialize(options: AppOptions): void {
    // WordwallsApp will be the holder of state.
    let listName: string;
    let autoSave: boolean;

    const style = new Styling(typeof options.addlParams.style === 'string' ? options.addlParams.style : JSON.stringify(options.addlParams.style));

    // Check if system prefers dark mode and the user hasn't explicitly set a preference
    const systemPrefersDark = detectDarkModePreference();

    // If dark mode is enabled by database setting (highest priority),
    // or by system preference when no explicit database setting exists
    if (style.darkMode || (style.darkMode === undefined && systemPrefersDark)) {
      // If the style doesn't explicitly have darkMode set but we're enabling it, set it
      if (!style.darkMode) {
        style.setStyleKey('darkMode', true);
      }

      // Set Bootstrap 5 native dark theme
      setTheme('dark');

      // Only auto-adjust backgrounds if user hasn't set a preference (empty background)
      if (style.background === '') {
        style.setStyleKey('background', getAppropriateBackground(style.background, true, false));
      }
      if (style.bodyBackground === '') {
        style.setStyleKey('bodyBackground', getAppropriateBackground(style.bodyBackground, true, true));
      }
    } else {
      // Set Bootstrap 5 native light theme
      setTheme('light');
    }

    // Get the list name from one of two places.
    if (options.addlParams.saveName) {
      listName = options.addlParams.saveName;
      autoSave = true;
    } else {
      listName = options.addlParams.tempListName || '';
      autoSave = false;
    }

    const container = document.getElementById('main-app-content');
    if (!container) {
      throw new Error('Main app content container not found');
    }

    const root = createRoot(container);
    // Render.
    root.render(
      React.createElement(WordwallsAppContainer, {
        username: options.username,
        listName,
        autoSave,
        lexicon: options.lexicon,
        displayStyle: style,
        tablenum: options.tablenum,
        currentHost: options.currentHost,
        defaultLexicon: options.defaultLexicon,
        challengeInfo: options.challengeInfo,
        availableLexica: options.availableLexica,
      }),
    );
  }
}

export default App;
