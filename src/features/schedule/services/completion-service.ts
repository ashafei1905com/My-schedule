import {
  LATE_MULTIPLIER,
  QADA_MULTIPLIER,
  type Stats,
} from "@/features/points/models/stats";
import { applyLifetimeXp, prestigeMultiplier } from "@/features/points/services/rank-service";
import type { DoneEntry, DoneMap, Task, TaskStatus } from "@/features/schedule/models/task";
import { completionKind } from "@/features/schedule/services/schedule-service";
import { kuwaitNowMinutes, todayISO } from "@/shared/lib/kuwait-time";

export function awardedPoints(task: Task, status: TaskStatus, prestigeLevel = 0): number {
  const base = task.pts || 0;
  let raw = base;
  if (status === "late") raw = Math.round(base * LATE_MULTIPLIER);
  else if (status !== "ontime") raw = Math.round(base * QADA_MULTIPLIER);
  return Math.round(raw * prestigeMultiplier(prestigeLevel));
}

export function completeTask(
  task: Task,
  done: DoneMap,
  stats: Stats,
  nowMins = kuwaitNowMinutes(),
): { done: DoneMap; stats: Stats; entry: DoneEntry; rankedUp: ReturnType<typeof applyLifetimeXp>["rankedUp"] } {
  const status = completionKind(task, nowMins);
  const pts = awardedPoints(task, status, stats.prestige_level || 0);
  const prev = done[task.id];
  const entry: DoneEntry = { at: todayISO(), pts, status };
  const nextDone = { ...done, [task.id]: entry };
  const delta = pts - (prev?.pts ?? 0);
  let nextStats: Stats = { ...stats, pts: Math.max(0, stats.pts + delta) };
  let rankedUp = null;
  if (delta > 0) {
    const xp = applyLifetimeXp(nextStats, delta);
    nextStats = xp.stats;
    rankedUp = xp.rankedUp;
  }
  return {
    done: nextDone,
    stats: nextStats,
    entry,
    rankedUp,
  };
}

export function uncompleteTask(
  taskId: string,
  done: DoneMap,
  stats: Stats,
): { done: DoneMap; stats: Stats } {
  const prev = done[taskId];
  if (!prev) return { done, stats };
  const next = { ...done };
  delete next[taskId];
  return {
    done: next,
    stats: { ...stats, pts: Math.max(0, stats.pts - prev.pts) },
  };
}
