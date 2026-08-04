// Vite entry point for the Great Wall.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../css/theme-enhancements.css';

import React from 'react';
import { createRoot } from 'react-dom/client';

import InfiniteApp from './infinite/app';
import Styling from './style';
import { getAppropriateBackground } from './background';
import { detectDarkModePreference, setTheme } from './dark_mode';

interface User {
  username: string;
  user_hash: string;
  name: string;
  email: string;
  createdAt: number;
}

interface InfiniteGlobals {
  wallId: number;
  lexicon: string;
  wordLength: number;
  style: string; // JSON string, possibly empty
  user: string; // JSON string
  intercomAppID: string;
}

declare global {
  interface Window {
    InfiniteGlobals: InfiniteGlobals;
  }
}

const globals = window.InfiniteGlobals;
const user: User = JSON.parse(globals.user);

// Reuse the player's saved wordwalls tile style so the zoomed-in rectangle looks
// exactly like the board they already know.
const style = new Styling(globals.style ? globals.style : undefined);

if (style.darkMode || (style.darkMode === undefined && detectDarkModePreference())) {
  if (!style.darkMode) {
    style.setStyleKey('darkMode', true);
  }
  setTheme('dark');
  if (style.background === '') {
    style.setStyleKey('background', getAppropriateBackground(style.background, true, false));
  }
  if (style.bodyBackground === '') {
    style.setStyleKey('bodyBackground', getAppropriateBackground(style.bodyBackground, true, true));
  }
} else {
  setTheme('light');
}

const container = document.getElementById('main-app-content');
if (!container) {
  throw new Error('Main app content container not found');
}

createRoot(container).render(
  React.createElement(InfiniteApp, {
    wallId: globals.wallId,
    lexicon: globals.lexicon,
    wordLength: globals.wordLength,
    displayStyle: style,
  }),
);

window.Intercom('boot', {
  app_id: globals.intercomAppID,
  user_hash: user.user_hash,
  name: user.name,
  email: user.email,
  created_at: user.createdAt,
  username: user.username,
});
