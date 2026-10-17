import { useCallback, useEffect, useState } from 'react';

import { WORDVAULT_LEXICA } from 'wordvaultapp/lexica';

import WordwallsAPI from '../../wordwalls_api';
import { connectErrorMessage } from '../../connect';
import {
  alphagramKey,
  getDecks,
  getDueCards,
  getDueCounts,
  NotLoggedInError,
} from '../../wordvault_client';
import { useWordVaultReview } from '../../use_wordvault_review';
import { plural } from '../../use_wordvault';

const RAW_QUESTIONS_URL = '/wordwalls/api/load_raw_questions/';

const DEFAULT_NUM_CARDS = 50;
const MAX_NUM_CARDS = 200;
const DEFAULT_SECS_PER_CARD = 15;
// The server's limits.
const MIN_QUESTIONS_PER_ROUND = 10;
const MAX_QUIZ_SECS = 3600;

interface Lexicon {
  id: number;
  lexicon: string;
  description: string;
}

interface DeckChoice {
  id: bigint; // 0 is the default deck
  name: string;
  due: number;
}

interface WordVaultDialogContainerProps {
  tablenum: number;
  lexicon: number;
  availableLexica: Lexicon[];
  onLoadNewList: (data: unknown) => void;
  // Called once the list is loaded, to close the lobby.
  onLoaded: () => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  notifyError: (error: Error | string) => void;
  api: WordwallsAPI;
  disabled: boolean;
}

const MIN_SECS_PER_CARD = 5;
const MAX_SECS_PER_CARD = 120;

// What's typed is kept as is while editing; this is the value to use.
const clampInput = (text: string, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(text));
  if (text.trim() === '' || Number.isNaN(n)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, n));
};

const formatTime = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

function WordVaultDialogContainer({
  tablenum,
  lexicon,
  availableLexica,
  onLoadNewList,
  onLoaded,
  showSpinner,
  hideSpinner,
  notifyError,
  api,
  disabled,
}: WordVaultDialogContainerProps) {
  const review = useWordVaultReview();
  const lexiconName = availableLexica.find((l) => l.id === lexicon)?.lexicon ?? '';
  const supported = WORDVAULT_LEXICA.includes(lexiconName);

  const [decks, setDecks] = useState<DeckChoice[] | null>(null);
  const [deckId, setDeckId] = useState<bigint>(BigInt(0));
  const [numCardsText, setNumCardsText] = useState(String(DEFAULT_NUM_CARDS));
  const [secsPerCardText, setSecsPerCardText] = useState(String(DEFAULT_SECS_PER_CARD));
  const numCards = clampInput(numCardsText, 1, MAX_NUM_CARDS, DEFAULT_NUM_CARDS);
  const secsPerCard = clampInput(
    secsPerCardText, MIN_SECS_PER_CARD, MAX_SECS_PER_CARD, DEFAULT_SECS_PER_CARD,
  );
  const [loadError, setLoadError] = useState('');

  const loadDecks = useCallback(() => {
    if (!supported) {
      return;
    }
    setDecks(null);
    setLoadError('');
    Promise.all([getDecks(lexiconName), getDueCounts(lexiconName)])
      .then(([lexiconDecks, dueCounts]) => {
        const choices: DeckChoice[] = [
          { id: BigInt(0), name: 'Default Deck', due: dueCounts.get(BigInt(0)) ?? 0 },
          ...lexiconDecks.map((d) => ({ ...d, due: dueCounts.get(d.id) ?? 0 })),
        ];
        setDecks(choices);
        // Start on the deck with the most due cards.
        const most = choices.reduce((a, b) => (b.due > a.due ? b : a));
        setDeckId(most.id);
      })
      .catch((e) => {
        setLoadError(e instanceof NotLoggedInError
          ? 'Please log in to use WordVault.'
          : `Could not load your WordVault decks: ${connectErrorMessage(e)}`);
      });
  }, [supported, lexiconName]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const deck = decks?.find((d) => d.id === deckId);
  const cardsInRound = Math.min(numCards, deck?.due ?? 0);
  const quizSecs = Math.min(cardsInRound * secsPerCard, MAX_QUIZ_SECS);

  const play = async () => {
    if (!deck || cardsInRound === 0) {
      return;
    }
    showSpinner();
    try {
      const cards = await getDueCards(lexiconName, deck.id, cardsInRound);
      if (cards.length === 0) {
        notifyError('No cards are due in this deck right now.');
        loadDecks();
        return;
      }
      const data = (await api.call(RAW_QUESTIONS_URL, {
        lexicon,
        rawQuestions: cards.map((c) => ({ q: c.alphagram, a: c.words })),
        desiredTime: Math.min(cards.length * secsPerCard, MAX_QUIZ_SECS) / 60,
        questionsPerRound: Math.max(cards.length, MIN_QUESTIONS_PER_ROUND),
        tablenum,
        wordvaultReview: true,
      })) as { tablenum: number; list_name: string };
      onLoadNewList(data);
      const cardMap: Record<string, string> = {};
      cards.forEach((c) => {
        cardMap[alphagramKey(c.alphagram)] = c.alphagram;
      });
      review.begin({
        tablenum: data.tablenum,
        listName: data.list_name,
        lexicon: lexiconName,
        deckName: deck.id === BigInt(0) ? undefined : deck.name,
        cards: cardMap,
      });
      onLoaded();
    } catch (e) {
      notifyError(e instanceof Error ? e : String(e));
    } finally {
      hideSpinner();
    }
  };

  // Ratings from the last round must be sent before starting another:
  // those cards have been seen, so they shouldn't come up again as if not.
  const unsent = review.session?.status === 'rating'
    ? Object.keys(review.session.ratings).length : 0;

  if (!supported) {
    return (
      <p className="mt-3">
        WordVault doesn&apos;t support
        {' '}
        {lexiconName}
        . Choose one of these lexica on the left:
        {' '}
        {WORDVAULT_LEXICA.join(', ')}
        .
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p>
        Quiz yourself on cards that are due in WordVault, a wall at a time.
        Afterwards you can adjust each card&apos;s rating before sending them all
        to WordVault.
      </p>
      {loadError && (
        <div className="alert alert-danger py-2" role="alert">
          {loadError}
        </div>
      )}
      {unsent > 0 && (
        <div className="alert alert-warning py-2 d-flex align-items-center gap-2 flex-wrap" role="alert">
          <span>
            {`Send your ratings for ${plural(unsent, 'card')} from your last WordVault round
            before starting another one.`}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={review.busy}
            onClick={async () => {
              await review.submit();
              loadDecks();
            }}
          >
            {review.busy ? 'Sending…' : 'Send them now'}
          </button>
        </div>
      )}
      {review.message && (
        <div className={`alert alert-${review.message.kind} py-2`} role="status">
          {review.message.text}
        </div>
      )}
      {!decks && !loadError && <p className="text-body-secondary">Loading your decks…</p>}
      {decks && (
        <>
          <div className="row g-3 align-items-end">
            <div className="col-sm-5">
              <label className="form-label" htmlFor="wordvault-deck">Deck</label>
              <select
                id="wordvault-deck"
                className="form-select"
                value={deckId.toString()}
                onChange={(e) => setDeckId(BigInt(e.target.value))}
              >
                {decks.map((d) => (
                  <option key={d.id.toString()} value={d.id.toString()}>
                    {`${d.name} (${d.due} due)`}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-3">
              <label className="form-label" htmlFor="wordvault-num-cards">Cards</label>
              <input
                id="wordvault-num-cards"
                type="number"
                className="form-control"
                min={1}
                max={MAX_NUM_CARDS}
                value={numCardsText}
                onChange={(e) => setNumCardsText(e.target.value)}
                onBlur={() => setNumCardsText(String(numCards))}
              />
            </div>
            <div className="col-sm-4">
              <label className="form-label" htmlFor="wordvault-secs">Seconds per card</label>
              <input
                id="wordvault-secs"
                type="number"
                className="form-control"
                min={MIN_SECS_PER_CARD}
                max={MAX_SECS_PER_CARD}
                value={secsPerCardText}
                onChange={(e) => setSecsPerCardText(e.target.value)}
                onBlur={() => setSecsPerCardText(String(secsPerCard))}
              />
            </div>
          </div>
          <p className="mt-3 mb-2">
            {cardsInRound > 0
              ? `${plural(cardsInRound, 'card')}, ${formatTime(quizSecs)} on the clock.`
              : 'No cards are due in this deck right now.'}
          </p>
          <button
            className="btn btn-primary"
            type="button"
            disabled={disabled || cardsInRound === 0 || unsent > 0}
            onClick={play}
          >
            Play!
          </button>
        </>
      )}
    </div>
  );
}

export default WordVaultDialogContainer;
