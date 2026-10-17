import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';

import * as Immutable from 'immutable';

import { connectErrorMessage } from './connect';
import { alphagramKey, batchScore } from './wordvault_client';
import {
  countRatings,
  loadSession,
  rateRound,
  saveSession,
  Score,
  scoresToSubmit,
  type ReviewSession,
} from './wordvault_review';
import { plural } from './use_wordvault';

export interface WordVaultReview {
  // The current or most recent review round, if any.
  session: ReviewSession | null;
  // Whether that round is the list loaded in this table.
  active: boolean;
  // Starts a review round for a list just loaded into a table.
  begin: (s: Omit<ReviewSession, 'wrong' | 'ratings' | 'status'>) => void;
  rating: (alphagram: string) => Score | undefined;
  setRating: (alphagram: string, score: Score) => void;
  // When a card is next due after submitting; null if it wasn't scored,
  // undefined if not submitted.
  result: (alphagram: string) => Date | null | undefined;
  counts: Map<Score, number>;
  submit: () => Promise<void>;
  discard: () => void;
  busy: boolean;
  message: { kind: 'success' | 'danger'; text: string } | null;
}

interface ReviewParams {
  tablenum: number;
  listName: string;
  questions: Immutable.OrderedMap<string, Immutable.Map<string, unknown>>;
  gameGoing: boolean;
  numberOfRounds: number;
  // False until we know whether a round in progress was resumed, so a
  // page load doesn't end the review before the round comes back.
  ready: boolean;
}

export function useWordVaultReviewState({
  tablenum, listName, questions, gameGoing, numberOfRounds, ready,
}: ReviewParams): WordVaultReview {
  const [session, setSessionState] = useState<ReviewSession | null>(loadSession);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<WordVaultReview['message']>(null);

  const setSession = useCallback((s: ReviewSession | null) => {
    saveSession(s);
    setSessionState(s);
  }, []);

  const active = !!session && session.tablenum === tablenum && session.listName === listName;

  // Rate the cards as the first round goes, and stop when it ends. Later
  // rounds of the list (the missed ones) are just practice.
  useEffect(() => {
    if (!ready || !active || !session) {
      return;
    }
    if (session.status !== 'loaded' && session.status !== 'playing') {
      return;
    }
    if (numberOfRounds !== 1) {
      return;
    }
    const { ratings, wrong } = questions.size > 0
      ? rateRound(session, questions)
      : session;
    const status = gameGoing ? 'playing' : 'rating';
    const next = {
      ...session, ratings, wrong, status,
    } as ReviewSession;
    if (JSON.stringify(next) !== JSON.stringify(session)) {
      setSession(next);
    }
  }, [ready, active, session, questions, gameGoing, numberOfRounds, setSession]);

  const begin = useCallback<WordVaultReview['begin']>((s) => {
    setMessage(null);
    setSession({
      ...s, wrong: [], ratings: {}, status: 'loaded',
    });
  }, [setSession]);

  const rating = useCallback(
    (alphagram: string) => session?.ratings[alphagramKey(alphagram)],
    [session],
  );

  const setRating = useCallback((alphagram: string, score: Score) => {
    if (!session || session.status !== 'rating') {
      return;
    }
    const key = alphagramKey(alphagram);
    if (!(key in session.cards)) {
      return;
    }
    setSession({ ...session, ratings: { ...session.ratings, [key]: score } });
  }, [session, setSession]);

  const result = useCallback((alphagram: string) => {
    const r = session?.results?.[alphagramKey(alphagram)];
    if (r === undefined) {
      return undefined;
    }
    return r === null ? null : new Date(r);
  }, [session]);

  const counts = useMemo(
    () => (session ? countRatings(session) : new Map<Score, number>()),
    [session],
  );

  const submit = useCallback(async () => {
    if (!session || session.status !== 'rating' || busy) {
      return;
    }
    const scores = scoresToSubmit(session);
    if (scores.length === 0) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { scored, notScored } = await batchScore(session.lexicon, scores);
      const results: Record<string, string | null> = {};
      scores.forEach(({ alphagram }) => {
        const due = scored.get(alphagram);
        results[alphagramKey(alphagram)] = due ? due.toISOString() : null;
      });
      setSession({ ...session, status: 'submitted', results });
      let text = `Sent ${plural(scored.size, 'rating')} to WordVault.`;
      if (notScored.length > 0) {
        text += ` Skipped ${plural(notScored.length, 'card')} that ${
          notScored.length === 1 ? 'was' : 'were'} just reviewed or no longer in WordVault.`;
      }
      setMessage({ kind: notScored.length > 0 ? 'danger' : 'success', text });
    } catch (e) {
      setMessage({
        kind: 'danger',
        text: `Could not send ratings to WordVault: ${connectErrorMessage(e)}`,
      });
    } finally {
      setBusy(false);
    }
  }, [session, busy, setSession]);

  const discard = useCallback(() => {
    setMessage(null);
    setSession(null);
  }, [setSession]);

  // The container re-renders on every guess; keep the same object unless
  // something here changed, so context consumers don't re-render too.
  return useMemo(() => ({
    session,
    active,
    begin,
    rating,
    setRating,
    result,
    counts,
    submit,
    discard,
    busy,
    message,
  }), [session, active, begin, rating, setRating, result, counts, submit, discard, busy, message]);
}

const noop = () => {};

export const WordVaultReviewContext = createContext<WordVaultReview>({
  session: null,
  active: false,
  begin: noop,
  rating: () => undefined,
  setRating: noop,
  result: () => undefined,
  counts: new Map(),
  submit: async () => {},
  discard: noop,
  busy: false,
  message: null,
});

export const useWordVaultReview = () => useContext(WordVaultReviewContext);
