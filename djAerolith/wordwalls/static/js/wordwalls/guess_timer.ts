/**
 * @fileOverview Implement (somewhat) exponential back-off retrying of guess
 * submissions based on a request id.
 */

const INITIAL_BACKOFF = 750;
const MAX_TRIES = 4;

interface TimerData {
  fn: () => void;
  curTimeout: number;
  numTries: number;
}

class GuessTimer {
  private timers: Record<string, TimerData>;

  constructor() {
    this.timers = {};
  }

  addTimer(reqId: string, callback: () => void): void {
    this.timers[reqId] = {
      fn: callback,
      curTimeout: window.setTimeout(() => {
        this.execTimer(reqId, callback);
      }, INITIAL_BACKOFF),
      numTries: 0,
    };
  }

  removeTimer(reqId: string): void {
    if (!this.timers[reqId]) {
      return;
    }
    const t = this.timers[reqId].curTimeout;
    window.clearTimeout(t);
    delete this.timers[reqId];
  }

  execTimer(reqId: string, callback: () => void): void {
    if (!this.timers[reqId]) {
      return;
    }
    this.timers[reqId].numTries += 1;
    if (this.timers[reqId].numTries >= MAX_TRIES) {
      // Done trying. XXX: show an error message saying we can't connect.
      return;
    }
    callback();
    this.timers[reqId].curTimeout = window.setTimeout(() => {
      this.execTimer(reqId, callback);
    }, INITIAL_BACKOFF * this.timers[reqId].numTries);
  }
}

export default GuessTimer;
