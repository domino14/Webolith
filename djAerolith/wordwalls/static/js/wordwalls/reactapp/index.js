/* global window */
import App from './app';
import Utils from './utils';

Utils.setupCsrfAjax();

App.initialize({
  lexicon: window.TableGlobals.lexicon,
  tablenum: window.TableGlobals.tablenum,
  addlParams: JSON.parse(window.TableGlobals.addlParams),
  username: window.TableGlobals.username,
});
