import { useCallback, useMemo, useState } from 'react';

import * as Immutable from 'immutable';

import { type ImmutableQuestion } from './immutable-types';
import {
  addCards,
  alphagramKey,
  getDecks,
  getExistingCards,
  NotLoggedInError,
  scoreAgain,
  scoreAllAgain,
  type VaultDeck,
} from './wordvault_client';
import { connectErrorMessage } from './connect';

// What we know about an alphagram's WordVault card.
export type VaultStatus =
  | 'unknown' // not loaded yet, or can't be added (e.g. has blanks)
  | 'absent'
  | 'inVault'
  | 'pending'
  | 'added'
  | 'markedMissed';

export interface WordVaultActions {
  enabled: boolean;
  lexicon: string;
  busy: boolean;
  message: { kind: 'success' | 'danger'; text: string } | null;
  status: (alphagram: string) => VaultStatus;
  add: (alphagram: string) => void;
  markMissed: (alphagram: string) => void;
  addAllMissed: () => void;
  numMissed: number;
  refresh: () => void;
  // Decks for this lexicon, not counting the default deck.
  decks: VaultDeck[];
  // Where new cards go; 0 is the default deck.
  deckId: bigint;
  setDeckId: (id: bigint) => void;
}

// Blank questions don't have a single real alphagram, so WordVault can't
// hold them.
const isEligible = (alphagram: string) => !alphagram.includes('?');

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const DEFAULT_DECK_ID = BigInt(0);

// Remember the chosen deck per lexicon, in this browser only.
const deckStorageKey = (lexicon: string) => `wordwalls.wordvaultDeck.${lexicon}`;

const loadDeckChoice = (lexicon: string): bigint => {
  try {
    const v = localStorage.getItem(deckStorageKey(lexicon));
    return v ? BigInt(v) : DEFAULT_DECK_ID;
  } catch {
    return DEFAULT_DECK_ID;
  }
};

const saveDeckChoice = (lexicon: string, id: bigint) => {
  try {
    localStorage.setItem(deckStorageKey(lexicon), id.toString());
  } catch {
    // Not important if this doesn't stick.
  }
};

export default function useWordVault(
  lexicon: string,
  questions: Immutable.OrderedMap<string, ImmutableQuestion>,
  enabled: boolean,
): WordVaultActions {
  const alphagrams = useMemo(() => {
    const out: string[] = [];
    questions.forEach((q) => {
      const a = q.get('a') as string;
      if (isEligible(a)) {
        out.push(a);
      }
    });
    return out;
  }, [questions]);
  // Questions get replaced when one is marked missed, but the round is the
  // same as long as its alphagrams are.
  const roundKey = `${lexicon}:${alphagrams.join(',')}`;

  const [loadedRound, setLoadedRound] = useState('');
  const [loggedOut, setLoggedOut] = useState(false);
  // alphagramKey -> stored alphagram, for cards already in the vault.
  const [existing, setExisting] = useState<Map<string, string>>(new Map());
  // alphagramKey -> what we did to it this round.
  const [actions, setActions] = useState<Map<string, VaultStatus>>(new Map());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<WordVaultActions['message']>(null);
  const [decks, setDecks] = useState<VaultDeck[]>([]);
  const [chosenDeckId, setChosenDeckId] = useState<bigint>(DEFAULT_DECK_ID);

  const isLoaded = loadedRound === roundKey;
  // Fall back to the default deck if the remembered one was deleted.
  const deckId = decks.some((d) => d.id === chosenDeckId) ? chosenDeckId : DEFAULT_DECK_ID;
  const deckName = decks.find((d) => d.id === deckId)?.name;

  const setDeckId = useCallback((id: bigint) => {
    setChosenDeckId(id);
    saveDeckChoice(lexicon, id);
  }, [lexicon]);

  const refresh = useCallback(() => {
    if (!enabled || loggedOut || alphagrams.length === 0) {
      return;
    }
    Promise.all([getExistingCards(lexicon, alphagrams), getDecks(lexicon)])
      .then(([cards, lexiconDecks]) => {
        setExisting(cards);
        setDecks(lexiconDecks);
        setChosenDeckId(loadDeckChoice(lexicon));
        if (loadedRound !== roundKey) {
          setActions(new Map());
          setMessage(null);
        }
        setLoadedRound(roundKey);
      })
      .catch((e) => {
        if (e instanceof NotLoggedInError) {
          setLoggedOut(true);
          return;
        }
        setMessage({
          kind: 'danger',
          text: `Could not load WordVault cards: ${connectErrorMessage(e)}`,
        });
      });
  }, [enabled, loggedOut, lexicon, alphagrams, roundKey, loadedRound]);

  const setAction = (keys: string[], s: VaultStatus) => {
    setActions((prev) => {
      const next = new Map(prev);
      keys.forEach((k) => next.set(k, s));
      return next;
    });
  };

  const status = useCallback(
    (alphagram: string): VaultStatus => {
      if (!isLoaded || !isEligible(alphagram)) {
        return 'unknown';
      }
      const key = alphagramKey(alphagram);
      return actions.get(key) ?? (existing.has(key) ? 'inVault' : 'absent');
    },
    [isLoaded, actions, existing],
  );

  const showError = (e: unknown) => {
    setMessage({ kind: 'danger', text: connectErrorMessage(e) });
  };

  const add = useCallback(
    (alphagram: string) => {
      const key = alphagramKey(alphagram);
      setAction([key], 'pending');
      addCards(lexicon, [alphagram], deckId)
        .then(() => setAction([key], 'added'))
        .catch((e) => {
          setAction([key], 'absent');
          showError(e);
        });
    },
    [lexicon, deckId],
  );

  const markMissed = useCallback(
    (alphagram: string) => {
      const key = alphagramKey(alphagram);
      const stored = existing.get(key) ?? alphagram;
      setAction([key], 'pending');
      scoreAgain(lexicon, stored)
        .then(() => setAction([key], 'markedMissed'))
        .catch((e) => {
          setAction([key], 'inVault');
          showError(e);
        });
    },
    [lexicon, existing],
  );

  // Missed alphagrams that the bulk button would still do something to.
  const pendingMissed = useMemo(() => {
    const toAdd: string[] = [];
    const toMark: string[] = [];
    if (!isLoaded) {
      return { toAdd, toMark };
    }
    questions.forEach((q) => {
      const a = q.get('a') as string;
      if (q.get('solved', false) || !isEligible(a)) {
        return;
      }
      const s = status(a);
      if (s === 'absent') {
        toAdd.push(a);
      } else if (s === 'inVault') {
        toMark.push(a);
      }
    });
    return { toAdd, toMark };
  }, [isLoaded, questions, status]);

  const addAllMissed = useCallback(async () => {
    const { toAdd, toMark } = pendingMissed;
    if (toAdd.length === 0 && toMark.length === 0) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const addKeys = toAdd.map(alphagramKey);
    setAction([...addKeys, ...toMark.map(alphagramKey)], 'pending');

    const parts: string[] = [];
    const errors: string[] = [];

    if (toAdd.length > 0) {
      try {
        const numAdded = await addCards(lexicon, toAdd, deckId);
        setAction(addKeys, 'added');
        parts.push(`added ${plural(numAdded, 'card')} to WordVault${
          deckName ? ` (${deckName})` : ''}`);
      } catch (e) {
        setAction(addKeys, 'absent');
        errors.push(`Could not add cards: ${connectErrorMessage(e)}`);
      }
    }

    if (toMark.length > 0) {
      const markKeys = toMark.map(alphagramKey);
      try {
        const notScored = new Set(
          (await scoreAllAgain(lexicon, toMark)).map(alphagramKey),
        );
        setAction(markKeys.filter((k) => !notScored.has(k)), 'markedMissed');
        setAction([...notScored], 'inVault');
        const numMarked = toMark.length - notScored.size;
        if (numMarked > 0) {
          parts.push(`marked ${plural(numMarked, 'existing card')} as missed`);
        }
        if (notScored.size > 0) {
          errors.push(`Skipped ${plural(notScored.size, 'card')} that ${
            notScored.size === 1 ? 'was' : 'were'} just reviewed or no longer in WordVault.`);
        }
      } catch (e) {
        setAction(markKeys, 'inVault');
        errors.push(`Could not mark cards as missed: ${connectErrorMessage(e)}`);
      }
    }

    let text = '';
    if (parts.length > 0) {
      text = `${parts.join(' and ')}.`;
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
    if (errors.length > 0) {
      text = [text, ...errors].filter(Boolean).join(' ');
    }
    setMessage({ kind: errors.length > 0 ? 'danger' : 'success', text });
    setBusy(false);
  }, [pendingMissed, lexicon, deckId, deckName]);

  return {
    enabled: enabled && !loggedOut && isLoaded,
    lexicon,
    busy,
    message,
    status,
    add,
    markMissed,
    addAllMissed,
    numMissed: pendingMissed.toAdd.length + pendingMissed.toMark.length,
    refresh,
    decks,
    deckId,
    setDeckId,
  };
}
