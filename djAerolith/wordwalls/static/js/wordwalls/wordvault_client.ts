/**
 * @fileOverview A WordVault client for wordwalls. WordVault authenticates
 * with a JWT minted by Aerolith, so this fetches one with the session
 * cookie and attaches it to every request.
 */
import { createConnectTransport } from '@connectrpc/connect-web';
import {
  createPromiseClient,
  Code,
  ConnectError,
  type Interceptor,
} from '@connectrpc/connect';

import { WordVaultService } from './gen/wordvault/api_connect';
import { Score } from './gen/wordvault/api_pb';
import { baseURL } from './connect';

let jwt = '';
let jwtPromise: Promise<string> | null = null;

export class NotLoggedInError extends Error {}

const fetchJwt = (): Promise<string> => {
  if (!jwtPromise) {
    jwtPromise = (async () => {
      const response = await fetch('/jwt', { credentials: 'include' });
      if (response.status === 401) {
        throw new NotLoggedInError('Not logged in');
      }
      const data = await response.json();
      jwt = data.token;
      return jwt;
    })().finally(() => {
      jwtPromise = null;
    });
  }
  return jwtPromise;
};

const authInterceptor: Interceptor = (next) => async (request) => {
  if (!jwt) {
    await fetchJwt();
  }
  request.header.set('Authorization', `Bearer ${jwt}`);
  try {
    return await next(request);
  } catch (err) {
    if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
      // The token probably expired; get a new one and retry once.
      await fetchJwt();
      request.header.set('Authorization', `Bearer ${jwt}`);
      return next(request);
    }
    throw err;
  }
};

const client = createPromiseClient(
  WordVaultService,
  createConnectTransport({
    baseUrl: `${baseURL}/api/`,
    interceptors: [authInterceptor],
  }),
);

// The server may store an alphagram in lexicon order rather than the order
// wordwalls uses, so compare alphagrams by their letters.
export const alphagramKey = (alphagram: string): string => [...alphagram].sort().join('');

/**
 * Returns a map from alphagramKey to the alphagram as WordVault stores it,
 * for every alphagram that is already a card.
 */
export async function getExistingCards(
  lexicon: string,
  alphagrams: string[],
): Promise<Map<string, string>> {
  const resp = await client.getCardInformation({ lexicon, alphagrams });
  const existing = new Map<string, string>();
  resp.cards.forEach((card) => {
    const stored = card.alphagram?.alphagram;
    if (stored) {
      existing.set(alphagramKey(stored), stored);
    }
  });
  return existing;
}

export interface VaultDeck {
  id: bigint; // 0 is the default deck
  name: string;
}

export async function getDecks(lexicon: string): Promise<VaultDeck[]> {
  const resp = await client.getDecks({});
  return resp.decks
    .filter((d) => d.lexicon === lexicon)
    .map((d) => ({ id: d.id, name: d.name }));
}

export async function addCards(
  lexicon: string,
  alphagrams: string[],
  deckId: bigint,
): Promise<number> {
  const resp = await client.addCards({ lexicon, alphagrams, deckId });
  return resp.numCardsAdded;
}

export async function scoreAgain(lexicon: string, alphagram: string): Promise<void> {
  await client.scoreCard({ lexicon, alphagram, score: Score.AGAIN });
}

/**
 * Scores several cards as Again in one request. Returns the alphagrams that
 * were not scored (no such card, or it was just reviewed).
 */
export async function scoreAllAgain(lexicon: string, alphagrams: string[]): Promise<string[]> {
  const resp = await client.scoreCards({ lexicon, alphagrams, score: Score.AGAIN });
  return resp.notScored;
}
