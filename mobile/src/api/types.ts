export interface WordAnswer {
  w: string;   // word
  d: string;   // definition
  fh: string;  // front hooks
  bh: string;  // back hooks
  ifh: boolean;
  ibh: boolean;
  s: string;   // lexicon symbols
}

export interface Question {
  a: string;          // alphagram (sorted letters)
  ws: WordAnswer[];   // answers
  p: number;          // probability order
  df?: number | string; // difficulty
  idx: number;        // index in word list
}

export interface StartResponse {
  questions: Question[];
  time: number;       // seconds
  gameType: string;
  serverMsg?: string;
}

export interface GuessResponse {
  g: boolean;   // quiz still going
  C: string;    // alphagram that was solved ("" if wrong)
  w: string;    // the word that was guessed
  a: boolean;   // already solved by someone else
  s: string;    // solver username
}

export interface ChallengeInfo {
  /** Matches the DailyChallengeName.pk on the server */
  id: number;
  name: string;
  /** Human-readable description shown in the list */
  numQuestions?: number;
  seconds?: number;
}

/** special_challenges returns a plain array */
export type SpecialChallengesResponse = ChallengeInfo[];

export interface NewChallengeResponse {
  tablenum: number;
  list_name: string;
  lexicon: string;
  autosave: boolean;
}
