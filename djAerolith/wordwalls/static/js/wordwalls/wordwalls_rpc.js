/**
 * @fileOverview The RPC API for the Wordwalls game.
 */

import GenericRPC from './generic_rpc';

class WordwallsRPC extends GenericRPC {
  constructor(tablenum) {
    super();
    if (tablenum) {
      this.setRPCURL(`/wordwalls/table/${tablenum}/rpc/`);
    }
  }

  setTablenum(tablenum) {
    this.setRPCURL(`/wordwalls/table/${tablenum}/rpc/`);
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
