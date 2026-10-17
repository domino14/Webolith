/**
 * @fileOverview The RPC API for the Wordwalls game.
 */

import GenericRPC from './generic_rpc';
import type WordwallsGame from './wordwalls_game';

interface GuessResponse {
  [key: string]: unknown;
}

interface StartGameResponse {
  [key: string]: unknown;
}

export interface ResumeResponse {
  // Whether the round is still running. A round whose time ran out while
  // the player was away comes back with going false, so its solutions can
  // still be shown.
  going: boolean;
  questions?: Parameters<WordwallsGame['init']>[0];
  // Words solved so far: word, alphagram, solver.
  solved?: { w: string; a: string; s: string }[];
  time?: number; // seconds left
  gameType?: string;
  wrongAnswers?: number;
}

interface GiveUpResponse {
  [key: string]: unknown;
}

interface TimerEndedResponse {
  ended: boolean;
  timeRemaining?: number; // seconds; present when ended === false
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

  async resumeGame(): Promise<ResumeResponse> {
    return this.rpcwrap('resume', {}) as Promise<ResumeResponse>;
  }

  async giveUp(): Promise<GiveUpResponse> {
    return this.rpcwrap('giveup', {}) as Promise<GiveUpResponse>;
  }

  async timerRanOut(): Promise<TimerEndedResponse> {
    return this.rpcwrap('timerEnded', {}) as Promise<TimerEndedResponse>;
  }
}

export default WordwallsRPC;