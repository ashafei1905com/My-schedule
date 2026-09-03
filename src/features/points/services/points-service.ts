import type { HistoryMap } from "@/features/history/models/day-log";
import {
  EMPTY_STATS,
  MISS_PENALTY_PER_TASK,
  type PenaltyRecord,
  type Stats,
} from "@/features/points/models/stats";
import { getRankMeta } from "@/features/points/services/rank-service";
import type { DoneMap, Task } from "@/features/schedule/models/task";
import { requiredTasks } from "@/features/schedule/services/schedule-service";
import { addDaysISO, todayISO, weekStartSaturday } from "@/shared/lib/kuwait-time";

export function resetWeeklyPointsIfNewWeek(stats: Stats, today = todayISO()): Stats {
  const start = weekStartSaturday(today);
  if (stats.lastPtsWeekStart === start) return stats;
  return { ...stats, pts: 0, lastPtsWeekStart: start };
}

export function applyMissedPenalty(
  yesterdayTasks: Task[],
  yesterdayDone: DoneMap,
  stats: Stats,
  alreadyPenalized: boolean,
  yesterdayISO: string,
): { stats: Stats; penalty: PenaltyRecord | null } {
  if (alreadyPenalized) return { stats, penalty: null };
  const req = requiredTasks(yesterdayTasks);
  const missed = req.filter((t) => !yesterdayDone[t.id]).length;
  if (missed === 0) return { stats, penalty: null };
  const deducted = missed * MISS_PENALTY_PER_TASK;
  return {
    stats: { ...stats, pts: Math.max(0, stats.pts - deducted) },
    penalty: { date: yesterdayISO, missed, deducted },
  };
}

export function applyStreak(
  todayTasks: Task[],
  todayDone: DoneMap,
  stats: Stats,
  today = todayISO(),
): Stats {
  const req = requiredTasks(todayTasks);
  if (req.length === 0) return stats;
  const allDone = req.every((t) => todayDone[t.id]);
  if (!allDone) {
    if (stats.lastComplete === today) return stats;
    if (stats.lastFail === today) return stats;
    return { ...stats, cur: 0, lastFail: today };
  }
  if (stats.lastComplete === today) return stats;
  const yesterday = addDaysISO(today, -1);
  const continueStreak = stats.lastComplete === yesterday;
  const cur = continueStreak ? stats.cur + 1 : 1;
  return {
    ...stats,
    cur,
    best: Math.max(stats.best, cur),
    lastComplete: today,
  };
}

export function mergeStats(local: Stats, cloud: Stats | null | undefined): Stats {
  if (!cloud) return local;
  const later = (a: string | null, b: string | null) => {
    if (!a) return b;
    if (!b) return a;
    return a > b ? a : b;
  };
  const unlocked = Array.from(
    new Set([...(local.unlockedThemes || []), ...(cloud.unlockedThemes || [])]),
  );
  const lifetime = Math.max(local.lifetime_xp || 0, cloud.lifetime_xp || 0);
  return {
    pts: Math.max(local.pts || 0, cloud.pts || 0),
    cur: Math.max(local.cur || 0, cloud.cur || 0),
    best: Math.max(local.best || 0, cloud.best || 0),
    lastComplete: later(local.lastComplete, cloud.lastComplete),
    lastFail: later(local.lastFail, cloud.lastFail),
    lastPtsWeekStart: later(local.lastPtsWeekStart, cloud.lastPtsWeekStart),
    lifetime_xp: lifetime,
    prestige_level: Math.max(local.prestige_level || 0, cloud.prestige_level || 0),
    rebirth_tokens: Math.max(local.rebirth_tokens || 0, cloud.rebirth_tokens || 0),
    unlockedThemes: unlocked,
    activeMythicTheme: cloud.activeMythicTheme || local.activeMythicTheme || null,
    lastRankKey: getRankMeta(lifetime).key,
  };
}

export function mergeHistory(local: HistoryMap, cloud: HistoryMap | null | undefined): HistoryMap {
  if (!cloud) return local;
  const out: HistoryMap = { ...local };
  for (const [date, day] of Object.entries(cloud)) {
    const existing = out[date];
    if (!existing) {
      out[date] = day;
      continue;
    }
    out[date] = {
      done: { ...(existing.done || {}), ...(day.done || {}) },
      penalty: day.penalty || existing.penalty || null,
    };
  }
  return out;
}

export { EMPTY_STATS };
