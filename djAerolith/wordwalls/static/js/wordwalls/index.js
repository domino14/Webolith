/* global window */
import App from './app';
import Utils from './utils';

const user = JSON.parse(window.TableGlobals.user);

Utils.setupCsrfAjax();

App.initialize({
  lexicon: window.TableGlobals.lexicon,
  tablenum: window.TableGlobals.tablenum,
  addlParams: JSON.parse(window.TableGlobals.addlParams),
  username: user.username,
  availableLexica: JSON.parse(window.TableGlobals.availableLexica),
  defaultLexicon: window.TableGlobals.defaultLexicon,
  challengeInfo: JSON.parse(window.TableGlobals.challengeInfo),
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
