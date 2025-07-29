// Import Bootstrap 5 CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Import Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

import App from './app';

const user = JSON.parse(window.TableGlobals.user);

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
