/**
 * Shared TypeScript interfaces for Immutable.js data structures
 * used across the wordwalls application.
 */

import Immutable from 'immutable';

export interface ImmutableWord extends Immutable.Map<string, unknown> {
  get(key: 'fh'): string;
  get(key: 'bh'): string;
  get(key: 'w'): string;
  get(key: 'ifh'): boolean;
  get(key: 'ibh'): boolean;
  get(key: 's'): string;
  get(key: 'd'): string;
  get(key: 'solved'): boolean;
  get(key: 'solved', defaultValue: boolean): boolean;
}

export interface ImmutableQuestion extends Immutable.Map<string, unknown> {
  get(key: 'idx'): number;
  get(key: 'p'): number | string;
  get(key: 'a'): string;
  get(key: 'ws'): Immutable.List<ImmutableWord>;
  get(key: 'df'): number | string;
  get(key: 'df', defaultValue: number | string): number | string;
  get(key: 'solved'): boolean;
  get(key: 'solved', defaultValue: boolean): boolean;
  get(key: 'wrongGuess'): boolean;
  get(key: 'wrongGuess', defaultValue: boolean): boolean;
}

export interface ImmutableWordAnswer extends Immutable.Map<string, unknown> {
  get(key: 'w'): string; // word
  get(key: 'd'): string; // definition
  get(key: 'fh'): string; // front hooks
  get(key: 'bh'): string; // back hooks
  get(key: 'ifh'): boolean; // inner front hook
  get(key: 'ibh'): boolean; // inner back hook
  get(key: 's'): string; // lexicon symbols
}
