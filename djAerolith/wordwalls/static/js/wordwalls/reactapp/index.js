/* global window */
import App from './app';

const app = new App();
app.initialize({
  lexicon: window.TableGlobals.lexicon,
  tablenum: window.TableGlobals.tablenum,
  addlParams: JSON.parse(window.TableGlobals.addlParams),
  username: window.TableGlobals.username,
});
