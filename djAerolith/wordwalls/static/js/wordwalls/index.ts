// Import Bootstrap 5 CSS only (JS components imported individually where needed)
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';
// Import theme enhancements for Bootstrap dark mode
import '../../css/theme-enhancements.css';

import App from './app';

// Define the shape of the global TableGlobals object
interface User {
  username: string;
  user_hash: string;
  name: string;
  email: string;
  createdAt: number;
}

interface TableGlobals {
  user: string; // JSON string
  lexicon: string;
  tablenum: number;
  currentHost: string;
  addlParams: string; // JSON string
  availableLexica: string; // JSON string
  defaultLexicon: string;
  challengeInfo: string; // JSON string
  socketServer: string;
  intercomAppID: string;
}

// Extend the Window interface to include our globals
declare global {
  interface Window {
    TableGlobals: TableGlobals;
    Intercom: (command: string, settings?: Record<string, unknown>) => void;
  }
}

const user: User = JSON.parse(window.TableGlobals.user);

App.initialize({
  lexicon: window.TableGlobals.lexicon,
  tablenum: window.TableGlobals.tablenum,
  currentHost: window.TableGlobals.currentHost,
  addlParams: JSON.parse(window.TableGlobals.addlParams),
  username: user.username,
  availableLexica: JSON.parse(window.TableGlobals.availableLexica),
  defaultLexicon: window.TableGlobals.defaultLexicon,
  challengeInfo: JSON.parse(window.TableGlobals.challengeInfo),
  socketServer: window.TableGlobals.socketServer,
});

// Finally, initialize Intercom.
window.Intercom('boot', {
  app_id: window.TableGlobals.intercomAppID,
  user_hash: user.user_hash,
  name: user.name,
  email: user.email,
  created_at: user.createdAt,
  username: user.username,
});