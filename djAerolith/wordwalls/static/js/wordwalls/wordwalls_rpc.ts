/**
 * @fileOverview The RPC API for the Wordwalls game.
 */

import GenericRPC from './generic_rpc';

interface GuessResponse {
  [key: string]: unknown;
}

interface StartGameResponse {
  [key: string]: unknown;
}

interface GiveUpResponse {
  [key: string]: unknown;
}

interface TimerEndedResponse {
  [key: string]: unknown;
}

class WordwallsRPC extends GenericRPC {
  constructor(tablenum?: number) {
    super();
    if (tablenum) {
      this.setRPCURL(`/wordwalls/table/${tablenum}/rpc/`);
    }
  }

  setTablenum(tablenum: number): void {
    this.setRPCURL(`/wordwalls/table/${tablenum}/rpc/`);
  }

  async guess(gstr: string, wrongAnswers: number): Promise<GuessResponse> {
    return this.rpcwrap('guess', {
      guess: gstr,
      wrongAnswers,
    }) as Promise<GuessResponse>;
  }

  async startGame(): Promise<StartGameResponse> {
    return this.rpcwrap('start', {}) as Promise<StartGameResponse>;
  }

  async giveUp(): Promise<GiveUpResponse> {
    return this.rpcwrap('giveup', {}) as Promise<GiveUpResponse>;
  }

  async timerRanOut(): Promise<TimerEndedResponse> {
    return this.rpcwrap('timerEnded', {}) as Promise<TimerEndedResponse>;
  }
}

export default WordwallsRPC;