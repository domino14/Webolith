/**
 * @fileOverview State store for the one rectangle currently zoomed into.
 *
 * Much smaller than wordwalls_game.ts: a rectangle has a fixed slot count that
 * maps straight onto wall cells, so there is no refill from a tail, no
 * alphagram -> display-slot remapping, and no missed/firstMissed bookkeeping. A
 * solved slot simply goes empty and stays empty. The slot count comes from the
 * wall's own geometry, not a module constant, so a wall built under an older
 * rectangle shape still lays out correctly.
 */
import * as Immutable from 'immutable';
import _ from 'underscore';

import { Internal } from '../wordwalls_game';
import { cellToSlot, type WallGeometry } from './geometry';
import type { QuestionPacket, WordPacket } from './rpc';

const { alphagrammize } = Internal();

export interface SolveResult {
  slot: number;
  alphagram: string;
  alphagramSolved: boolean;
}

const EMPTY_SLOT = Immutable.Map<string, unknown>();

class ChunkState {
  /** One entry per slot; empty maps render as invisible placeholders. */
  private slots: Immutable.List<Immutable.Map<string, unknown>>;

  /** Unsolved word -> its slot. */
  private wordSlots: Record<string, number>;

  /** Every word this rectangle ever served, so we can tell stale from wrong. */
  private everWords: Record<string, boolean>;

  /** Alphagram of each unsolved question, for wrong-guess highlighting. */
  private unsolvedAlphagrams: Record<string, number>;

  private chunk: number;

  private alphagramsLeft: number;

  private wordsLeft: number;

  constructor() {
    this.slots = Immutable.List();
    this.wordSlots = {};
    this.everWords = {};
    this.unsolvedAlphagrams = {};
    this.chunk = -1;
    this.alphagramsLeft = 0;
    this.wordsLeft = 0;
  }

  /**
   * Lay a server payload out into slots.
   *
   * The server omits fully solved alphagrams and already-found words, so
   * whatever arrives is exactly what is still outstanding.
   */
  init(geo: WallGeometry, chunk: number, questions: QuestionPacket[]): void {
    const slots: Immutable.Map<string, unknown>[] = [];
    for (let i = 0; i < geo.chunkSize; i += 1) {
      slots.push(EMPTY_SLOT);
    }

    this.chunk = chunk;
    this.wordSlots = {};
    this.everWords = {};
    this.unsolvedAlphagrams = {};
    this.alphagramsLeft = 0;
    this.wordsLeft = 0;

    questions.forEach((question) => {
      const slot = cellToSlot(geo, question.g);
      const wMap: Record<string, WordPacket> = {};
      question.ws.forEach((word) => {
        wMap[word.w] = word;
        this.wordSlots[word.w] = slot;
        this.everWords[word.w] = true;
        this.wordsLeft += 1;
      });
      this.unsolvedAlphagrams[question.a] = slot;
      this.alphagramsLeft += 1;
      slots[slot] = Immutable.fromJS({
        a: question.a,
        wMap,
        displayedAs: question.a,
      }) as Immutable.Map<string, unknown>;
    });

    this.slots = Immutable.List(slots);
  }

  clear(): void {
    this.slots = Immutable.List();
    this.wordSlots = {};
    this.everWords = {};
    this.unsolvedAlphagrams = {};
    this.chunk = -1;
    this.alphagramsLeft = 0;
    this.wordsLeft = 0;
  }

  getChunk(): number {
    return this.chunk;
  }

  getQuestionState(): Immutable.List<Immutable.Map<string, unknown>> {
    return this.slots;
  }

  getAlphagramsLeft(): number {
    return this.alphagramsLeft;
  }

  getWordsLeft(): number {
    return this.wordsLeft;
  }

  /** Is this a word we still need? Used to avoid pointless server round trips. */
  answerExists(guess: string): boolean {
    return this.wordSlots[guess] != null;
  }

  /** Did this rectangle ever serve this word? Distinguishes stale from wrong. */
  originalAnswerExists(guess: string): boolean {
    return this.everWords[guess] === true;
  }

  /** Whether the word is CSW-only, for the octothorp setting. */
  isCSW(word: string): boolean {
    const slot = this.wordSlots[word];
    if (slot == null) {
      return false;
    }
    const wObj = this.slots.getIn([slot, 'wMap', word]) as
      | Immutable.Map<string, unknown>
      | undefined;
    return wObj ? String(wObj.get('s') ?? '').includes('#') : false;
  }

  /**
   * Flag the question a wrong guess was aiming at, so the player sees which
   * alphagram they fumbled. Returns whether anything was flagged.
   */
  markPotentialIncorrectGuess(guess: string): boolean {
    if (this.originalAnswerExists(guess)) {
      return false;
    }
    const slot = this.unsolvedAlphagrams[alphagrammize(guess)];
    if (slot == null) {
      return false;
    }
    this.slots = this.slots.update(slot, (obj) => (
      obj ? obj.set('wrongGuess', true) : obj
    ));
    return true;
  }

  /**
   * Remove a solved word. Returns null when the word was not outstanding, so
   * a duplicate server response is a no-op rather than a double count.
   */
  solve(word: string, alphagram: string): SolveResult | null {
    const slot = this.wordSlots[word];
    if (slot == null) {
      return null;
    }
    const slotObj = this.slots.get(slot);
    if (!slotObj || slotObj.get('a') !== alphagram) {
      return null;
    }

    delete this.wordSlots[word];
    this.wordsLeft -= 1;
    this.slots = this.slots.deleteIn([slot, 'wMap', word]);

    const remaining = this.slots.getIn([slot, 'wMap']) as
      | Immutable.Map<string, unknown>
      | undefined;
    const alphagramSolved = !remaining || remaining.size === 0;
    if (alphagramSolved) {
      this.slots = this.slots.set(slot, EMPTY_SLOT);
      delete this.unsolvedAlphagrams[alphagram];
      this.alphagramsLeft -= 1;
    }
    return { slot, alphagram, alphagramSolved };
  }

  // -- tile ordering -------------------------------------------------------

  shuffle(slot: number): void {
    this.slots = this.slots.update(slot, (obj) => (
      obj && obj.get('a')
        ? obj.set('displayedAs', _.shuffle(obj.get('a') as string).join(''))
        : obj
    ));
  }

  shuffleAll(): void {
    for (let i = 0; i < this.slots.size; i += 1) {
      this.shuffle(i);
    }
  }

  resetAllOrders(): void {
    this.slots = this.slots.map((obj) => (
      obj && obj.get('a') ? obj.set('displayedAs', obj.get('a')) : obj
    )).toList();
  }

  setCustomLetterOrder(order: string): void {
    if (!order) {
      return;
    }
    const customOrder = (letters: string): string => _.sortBy(
      letters,
      (letter) => order.indexOf(letter),
    ).join('');
    this.slots = this.slots.map((obj) => (
      obj && obj.get('a')
        ? obj.set('displayedAs', customOrder(obj.get('a') as string))
        : obj
    )).toList();
  }
}

export default ChunkState;
