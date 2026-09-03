import type { Stats } from "@/features/points/models/stats";

export interface RankTier {
  key: string;
  min: number;
  title: string;
  titleAr: string;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  { key: "chaos", min: 0, title: "Chaos Coordinator", titleAr: "منسّق الفوضى", icon: "🕒" },
  { key: "habit", min: 500, title: "Habit Builder", titleAr: "باني العادات", icon: "⚡" },
  { key: "focus", min: 1000, title: "Focus Master", titleAr: "سيد التركيز", icon: "🧠" },
  { key: "defender", min: 2000, title: "Time Defender", titleAr: "مدافع الوقت", icon: "🛡️" },
  { key: "timelord", min: 3500, title: "Time Lord", titleAr: "سيد الزمن", icon: "🌌" },
];

export function getRankMeta(xp: number): RankTier {
  const n = Math.max(0, Number(xp) || 0);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (n >= RANK_TIERS[i].min) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

export function prestigeMultiplier(level: number): number {
  return 1 + Math.max(0, Number(level) || 0) * 0.1;
}

export function applyLifetimeXp(stats: Stats, awarded: number): { stats: Stats; rankedUp: RankTier | null } {
  if (awarded <= 0) return { stats, rankedUp: null };
  const prev = getRankMeta(stats.lifetime_xp || 0);
  const lifetime_xp = (stats.lifetime_xp || 0) + awarded;
  const now = getRankMeta(lifetime_xp);
  return {
    stats: {
      ...stats,
      lifetime_xp,
      lastRankKey: now.key,
    },
    rankedUp: now.key !== prev.key ? now : null,
  };
}

export function canRebirth(stats: Stats): boolean {
  return (stats.lifetime_xp || 0) >= 3500 || getRankMeta(stats.lifetime_xp || 0).key === "timelord";
}

export function performRebirth(stats: Stats): Stats {
  return {
    ...stats,
    lifetime_xp: 0,
    prestige_level: (stats.prestige_level || 0) + 1,
    rebirth_tokens: (stats.rebirth_tokens || 0) + 1,
    lastRankKey: "chaos",
  };
}
