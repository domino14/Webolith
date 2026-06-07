/**
 * GameEngine — plain-TS port of the core logic in wordwalls_game.ts.
 *
 * No Immutable.js. State is plain objects/arrays; solve() returns a new
 * visibleQuestions array so React can detect changes via reference equality.
 */
import type { Question } from '../api/types';
import { MAX_ON_SCREEN } from '../api/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisibleQuestion {
  /** Alphagram string (sorted letters, server canonical form) */
  a: string;
  /** Current letter order shown in the tile rack. Array so we can shuffle. */
  displayedAs: string[];
  answersRemaining: number;
  totalAnswers: number;
  wrongGuess: boolean;
}

export interface SolveResult {
  /** Updated visible list (new array reference). */
  visibleQuestions: VisibleQuestion[];
  /** True if the word was newly solved (not a stale/dup response). */
  solved: boolean;
  /** True if this solve completed all answers for the alphagram. */
  alphagramComplete: boolean;
  /** Index of the solved slot (before any splice). */
  solvedIndex: number;
  /** True if a pending question slid into the solved slot (list length unchanged).
   *  False means the slot was removed via splice (list shrank by 1). */
  hadReplacement: boolean;
}

// ---------------------------------------------------------------------------
// Helpers (ported from wordwalls_game.ts)
// ---------------------------------------------------------------------------

const SORT_STRING_ORDER = 'AĄBCĆ1DEĘFGHIJKLŁ2MNŃÑOÓPQR3SŚTUVWXYZŹŻ?';
const LETTER_SORT_MAP: Record<string, number> = {};

function ensureSortMap(): void {
  if (Object.keys(LETTER_SORT_MAP).length > 0) return;
  for (let i = 0; i < SORT_STRING_ORDER.length; i++) {
    LETTER_SORT_MAP[SORT_STRING_ORDER[i]] = i;
  }
}

function alphagrammize(word: string): string {
  ensureSortMap();
  return word
    .split('')
    .sort((a, b) => (LETTER_SORT_MAP[a] ?? 99) - (LETTER_SORT_MAP[b] ?? 99))
    .join('');
}

function letterCounts(word: string): Record<string, number> {
  const lc: Record<string, number> = {};
  for (const ch of word) {
    lc[ch] = (lc[ch] ?? 0) + 1;
  }
  return lc;
}

function isAnagramOf(guess: string, alphagram: string): boolean {
  const remaining = letterCounts(alphagram);
  for (const ch of guess) {
    if (remaining[ch] > 0) {
      remaining[ch]--;
    } else if (remaining['?'] > 0) {
      remaining['?']--;
    } else {
      return false;
    }
  }
  return Object.values(remaining).every((v) => v === 0);
}

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

export class GameEngine {
  // Fast lookup: word → index in the original ws array (used to check existence)
  private missedWordsHash: Record<string, number> = {};
  // Every word that was ever in this round (for "already solved" detection)
  private originalWordsHash: Record<string, boolean> = {};
  // Alphagram string → set of remaining answer words
  private alphaAnswersHash: Record<string, boolean> = {};
  // Alphagram string → index in visibleQuestions (-1 means in pending)
  private alphaIndexHash: Record<string, number> = {};

  private pendingQuestions: VisibleQuestion[] = [];
  private _visibleQuestions: VisibleQuestion[] = [];

  alphagramsLeft = 0;
  totalWords = 0;
  solvedWords = 0;

  get visibleQuestions(): VisibleQuestion[] {
    return this._visibleQuestions;
  }

  load(questions: Question[]): void {
    this.missedWordsHash = {};
    this.originalWordsHash = {};
    this.alphaAnswersHash = {};
    this.alphaIndexHash = {};
    this.pendingQuestions = [];
    this._visibleQuestions = [];
    this.alphagramsLeft = 0;
    this.totalWords = 0;
    this.solvedWords = 0;

    const all: VisibleQuestion[] = questions.map((q) => {
      q.ws.forEach((word, idx) => {
        this.missedWordsHash[word.w] = idx;
        this.originalWordsHash[word.w] = true;
        this.alphaAnswersHash[alphagrammize(word.w)] = true;
        this.totalWords++;
      });
      return {
        a: q.a,
        displayedAs: q.a.split(''),
        answersRemaining: q.ws.length,
        totalAnswers: q.ws.length,
        wrongGuess: false,
      };
    });

    this.alphagramsLeft = all.length;

    // First MAX_ON_SCREEN go on screen; rest queue up.
    this._visibleQuestions = all.slice(0, MAX_ON_SCREEN);
    this.pendingQuestions = all.slice(MAX_ON_SCREEN);

    // Build alphaIndexHash for visible questions only.
    this._visibleQuestions.forEach((q, idx) => {
      this.alphaIndexHash[q.a] = idx;
    });
  }

  answerExists(word: string): boolean {
    return this.missedWordsHash[word] != null;
  }

  originalAnswerExists(word: string): boolean {
    return this.originalWordsHash[word] === true;
  }

  /**
   * Returns the alphagram if the guess is an anagram of any unanswered
   * alphagram (used for wrong-guess visual feedback). No blanks/build
   * mode in MVP.
   */
  guessInUnansweredQuestions(guess: string): string | null {
    const alph = alphagrammize(guess);
    if (this.alphaAnswersHash[alph]) return alph;
    // Fallback: full scan for blank tiles (alphagram contains '?')
    for (const alpha of Object.keys(this.alphaIndexHash)) {
      if (alpha.includes('?') && isAnagramOf(guess, alpha)) return alpha;
    }
    return null;
  }

  /**
   * Mark an alphagram as having a wrong guess (for red flash in the row).
   */
  markWrongGuess(alphagram: string): void {
    const idx = this.alphaIndexHash[alphagram];
    if (idx == null) return;
    const updated = [...this._visibleQuestions];
    updated[idx] = { ...updated[idx], wrongGuess: true };
    this._visibleQuestions = updated;
  }

  clearWrongGuess(alphagram: string): void {
    const idx = this.alphaIndexHash[alphagram];
    if (idx == null) return;
    const updated = [...this._visibleQuestions];
    updated[idx] = { ...updated[idx], wrongGuess: false };
    this._visibleQuestions = updated;
  }

  /**
   * Record a server-confirmed solve. Updates all hashes and the visible list.
   * Returns a SolveResult with the new visibleQuestions reference.
   */
  solve(word: string, alphagram: string): SolveResult {
    const widx = this.missedWordsHash[word];
    const aidx = this.alphaIndexHash[alphagram];

    if (widx == null || aidx == null) {
      return {
        visibleQuestions: this._visibleQuestions,
        solved: false,
        alphagramComplete: false,
        solvedIndex: 0,
        hadReplacement: false,
      };
    }

    delete this.missedWordsHash[word];
    this.solvedWords++;

    const updated = [...this._visibleQuestions];
    const current = updated[aidx];
    const newRemaining = current.answersRemaining - 1;
    const alphagramComplete = newRemaining === 0;

    if (!alphagramComplete) {
      updated[aidx] = { ...current, answersRemaining: newRemaining, wrongGuess: false };
      this._visibleQuestions = updated;
      return { visibleQuestions: this._visibleQuestions, solved: true, alphagramComplete: false, solvedIndex: aidx, hadReplacement: false };
    }

    // Alphagram fully solved.
    this.alphagramsLeft--;
    delete this.alphaIndexHash[alphagram];
    const alph = alphagrammize(word);
    delete this.alphaAnswersHash[alph];

    // Replace the solved slot with the next pending question (or leave empty).
    const next = this.pendingQuestions.shift();
    const hadReplacement = !!next;
    if (next) {
      updated[aidx] = next;
      this.alphaIndexHash[next.a] = aidx;
    } else {
      // Remove the slot entirely so the list shrinks.
      updated.splice(aidx, 1);
      // Re-index everything after aidx.
      for (let i = aidx; i < updated.length; i++) {
        this.alphaIndexHash[updated[i].a] = i;
      }
    }

    this._visibleQuestions = updated;
    return { visibleQuestions: this._visibleQuestions, solved: true, alphagramComplete: true, solvedIndex: aidx, hadReplacement };
  }

  /**
   * Shuffle the displayed tiles for one alphagram. Returns the new
   * visibleQuestions reference.
   */
  shuffle(alphagram: string): VisibleQuestion[] {
    const idx = this.alphaIndexHash[alphagram];
    if (idx == null) return this._visibleQuestions;
    const updated = [...this._visibleQuestions];
    const current = updated[idx];
    const shuffled = [...current.displayedAs];
    // Fisher-Yates
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    updated[idx] = { ...current, displayedAs: shuffled };
    this._visibleQuestions = updated;
    return this._visibleQuestions;
  }

  getRemainingWords(): string[] {
    return Object.keys(this.missedWordsHash);
  }
}
