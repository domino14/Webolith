export type FsrsCardJson = {
  Due: string;
  Stability: number;
  Difficulty: number;
  Reps: number;
  Lapses: number;
  State: number;
  LastReview: string;
};

export enum CardStat {
  DUE_DATE,
  TIMES_SEEN,
  RECALL_RATE,
  LAST_SEEN,
}
