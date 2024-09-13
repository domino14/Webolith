import App from './app';
import Utils from './utils';


// Import Bootstrap's JavaScript and CSS with relative paths
// import 'bootstrap';


const user = JSON.parse(window.TableGlobals.user);

Utils.setupCsrfAjax();

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
