/**
 * @fileOverview A WordVault review round: a wall made of a deck's due
 * cards. Ratings are worked out from the round and kept in this browser
 * until the player confirms them, and only then sent to WordVault, in one
 * request.
 */
import * as Immutable from 'immutable';

import { Score } from './gen/wordvault/api_pb';
import { alphagramKey } from './wordvault_client';

export { Score };

export type ReviewStatus =
  | 'loaded' // the list is loaded but the round hasn't started
  | 'playing'
  | 'rating' // the round is over; the player can adjust ratings
  | 'submitted';

export interface ReviewSession {
  tablenum: number;
  // The table's list name, so a later list in the same table isn't
  // mistaken for this one.
  listName: string;
  lexicon: string;
  deckName?: string;
  // alphagramKey -> the alphagram as WordVault stores it.
  cards: Record<string, string>;
  // alphagramKeys of cards with a wrong guess; they stay missed.
  wrong: string[];
  // alphagramKey -> rating; empty until the round starts.
  ratings: Record<string, Score>;
  status: ReviewStatus;
  // After submitting: alphagramKey -> when it's next due (ISO date), or
  // null if it was not scored.
  results?: Record<string, string | null>;
}

export const RATING_LABELS: [Score, string][] = [
  [Score.AGAIN, 'Missed'],
  [Score.HARD, 'Hard'],
  [Score.GOOD, 'Good'],
  [Score.EASY, 'Easy'],
];

const STORAGE_KEY = 'wordwalls.wordvaultReview';

export function loadSession(): ReviewSession | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? (JSON.parse(v) as ReviewSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: ReviewSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Then a reload loses the ratings; nothing else to do.
  }
}

/**
 * Rates the session's cards from the round's questions: Good if every
 * word was found without a wrong guess, Missed otherwise. Returns the new
 * ratings and wrong-guess list.
 */
export function rateRound(
  session: ReviewSession,
  questions: Immutable.OrderedMap<string, Immutable.Map<string, unknown>>,
): { ratings: Record<string, Score>; wrong: string[] } {
  const wrong = new Set(session.wrong);
  const ratings: Record<string, Score> = { ...session.ratings };
  questions.forEach((q) => {
    const key = alphagramKey(q.get('a') as string);
    if (!(key in session.cards)) {
      return;
    }
    if (q.get('wrongGuess', false)) {
      wrong.add(key);
    }
    ratings[key] = q.get('solved', false) && !wrong.has(key) ? Score.GOOD : Score.AGAIN;
  });
  return { ratings, wrong: [...wrong] };
}

/** How many cards have each rating. */
export function countRatings(session: ReviewSession): Map<Score, number> {
  const counts = new Map<Score, number>();
  Object.values(session.ratings).forEach((s) => {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  });
  return counts;
}

/** The scores to send to WordVault, by stored alphagram. */
export function scoresToSubmit(
  session: ReviewSession,
): { alphagram: string; score: Score }[] {
  return Object.entries(session.ratings).map(([key, score]) => ({
    alphagram: session.cards[key],
    score,
  }));
}
