/**
 * @fileOverview The RPC API for the Wordwalls game.
 */

import _ from 'underscore';

import Cookies from 'js-cookie';

function uniqueId() {
  return Math.random().toString(36).substring(2)
    + (new Date()).getTime().toString(36);
}

class WordwallsRPC {
  constructor(tablenum) {
    this.fetchInit = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      }),
      credentials: 'include',
    };
    this.tablenum = tablenum;
    if (tablenum) {
      this.tableurl = `/wordwalls/table/${tablenum}/rpc/`;
    } else {
      this.tableurl = null;
    }
  }

  setTablenum(tablenum) {
    this.tablenum = tablenum;
    this.tableurl = `/wordwalls/table/${tablenum}/rpc/`;
  }

  /**
   * Generate a JSON RPC data packet.
   */
  fetchdata(method, params) {
    return _.extend(this.fetchInit, {
      body: JSON.stringify({
        id: uniqueId(),
        jsonrpc: '2.0',
        method,
        params,
      }),
    });
  }

  async rpcwrap(method, params) {
    if (!this.tableurl) {
      await Promise.reject(new Error('You are not in a table.'));
    }
    // eslint-disable-next-line compat/compat
    const response = await fetch(this.tableurl, this.fetchdata(method, params));
    const data = await response.json();
    if (response.ok) {
      // Use the `result` key - since this is JSONRPC
      return data.result;
    }
    // Otherwise, there's an error.
    throw new Error(data.error.message);
  }

  guess(gstr) {
    return this.rpcwrap('guess', {
      guess: gstr,
    });
  }

  startGame() {
    return this.rpcwrap('start', {});
  }

  giveUp() {
    return this.rpcwrap('giveup', {});
  }

  timerRanOut() {
    return this.rpcwrap('timerEnded', {});
  }
}

export default WordwallsRPC;
