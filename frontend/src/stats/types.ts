export type ParsedFsrsCardStats = {
  Difficulty: number;
  Due: string;
  ElapsedDays: number;
  Lapses: number;
  LastReview: string;
  Reps: number;
  ScheduledDays: number;
  Stability: number;
  State: number;
};

export enum CardRecallStat {
  DUE_DATE,
  TIMES_SEEN,
  RECALL_RATE,
  LAST_SEEN,
}
