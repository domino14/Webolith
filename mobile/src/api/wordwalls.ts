import { apiGet, apiPost } from './client';
import { API_BASE } from './config';
import type {
  NewChallengeResponse,
  SpecialChallengesResponse,
  StartResponse,
  GuessResponse,
} from './types';

// ---------------------------------------------------------------------------
// Challenge list
// ---------------------------------------------------------------------------

export function fetchSpecialChallenges(
  lexiconId: number,
  date?: string,
): Promise<SpecialChallengesResponse> {
  const params = new URLSearchParams({ lexicon: String(lexiconId) });
  if (date) params.set('date', date);
  return apiGet<SpecialChallengesResponse>(
    `${API_BASE}/wordwalls/api/special_challenges/?${params}`,
  );
}

export function loadChallenge(
  lexiconId: number,
  challengeId: number,
  date: string,
): Promise<NewChallengeResponse> {
  return apiPost<NewChallengeResponse>(
    `${API_BASE}/wordwalls/api/mobile/new_challenge/`,
    {
      tablenum: 0,
      lexicon: lexiconId,
      challenge: challengeId,
      date,
      multiplayer: false,
    },
  );
}

// ---------------------------------------------------------------------------
// Aerolith built-in lists
// ---------------------------------------------------------------------------

export interface AerolithListOption {
  id: number;
  name: string;
  numAlphas: number;
  wordLength: number;
  lexicon: string;
}

export function fetchDefaultLists(lexiconId: number): Promise<AerolithListOption[]> {
  return apiGet<AerolithListOption[]>(
    `${API_BASE}/wordwalls/api/mobile/default_lists/?lexicon=${lexiconId}`,
  );
}

export function loadAerolithList(
  selectedList: number,
  lexiconId: number,
  timeSecs: number,
): Promise<NewChallengeResponse> {
  return apiPost<NewChallengeResponse>(
    `${API_BASE}/wordwalls/api/mobile/load_aerolith_list/`,
    {
      selectedList,
      lexicon: lexiconId,
      quiz_time_secs: timeSecs,
      questions_per_round: null,
      tablenum: 0,
      multiplayer: false,
    },
  );
}

// ---------------------------------------------------------------------------
// RPC helpers  (all POST to the mobile-specific csrf-exempt endpoint)
// ---------------------------------------------------------------------------

function rpc<T>(tablenum: number, method: string, params: object = {}): Promise<T> {
  return apiPost<{ result: T }>(
    `${API_BASE}/wordwalls/api/mobile/table/${tablenum}/rpc/`,
    { jsonrpc: '2.0', method, params, id: 1 },
  ).then((resp) => (resp as { result: T }).result);
}

export function startGame(tablenum: number): Promise<StartResponse> {
  return rpc<StartResponse>(tablenum, 'start');
}

export function sendGuess(
  tablenum: number,
  guess: string,
  wrongAnswers: number,
): Promise<GuessResponse> {
  return rpc<GuessResponse>(tablenum, 'guess', { guess, wrongAnswers });
}

export function giveUp(tablenum: number): Promise<boolean> {
  return rpc<boolean>(tablenum, 'giveup');
}

export function timerEnded(tablenum: number): Promise<boolean> {
  return rpc<boolean>(tablenum, 'timerEnded');
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  user: string;
  score: number;
  tr?: number;   // timeRemaining
  w?: number;    // wrong_answers
  addl?: string; // JSON-encoded medal data
}

export interface LeaderboardResponse {
  maxScore: number;
  entries: LeaderboardEntry[];
  challengeName?: string;
  lexicon?: string;
}

export function fetchLeaderboard(tablenum: number): Promise<LeaderboardResponse> {
  return apiGet<LeaderboardResponse>(
    `${API_BASE}/wordwalls/api/challengers_by_tablenum/?tablenum=${tablenum}`,
  );
}
