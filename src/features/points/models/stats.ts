export interface Stats {
  pts: number;
  cur: number;
  best: number;
  lastComplete: string | null;
  lastFail: string | null;
  lastPtsWeekStart: string | null;
  lifetime_xp: number;
  prestige_level: number;
  rebirth_tokens: number;
  unlockedThemes: string[];
  activeMythicTheme: string | null;
  lastRankKey: string;
}

export const EMPTY_STATS: Stats = {
  pts: 0,
  cur: 0,
  best: 0,
  lastComplete: null,
  lastFail: null,
  lastPtsWeekStart: null,
  lifetime_xp: 0,
  prestige_level: 0,
  rebirth_tokens: 0,
  unlockedThemes: [],
  activeMythicTheme: null,
  lastRankKey: "chaos",
};

export interface PenaltyRecord {
  date: string;
  missed: number;
  deducted: number;
}

export const LATE_MULTIPLIER = 0.5;
export const QADA_MULTIPLIER = 0.25;
export const MISS_PENALTY_PER_TASK = 5;
