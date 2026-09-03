import type { PersistedAppState } from "@/features/persistence/models/app-state";
import { STORAGE_KEY } from "@/features/persistence/models/app-state";
import { EMPTY_STATS } from "@/features/points/models/stats";
import { buildFocusWeek } from "@/features/schedule/services/template-service";
import { DEFAULT_SETTINGS } from "@/features/settings/models/user-settings";

export function emptyPersisted(): PersistedAppState {
  return {
    schedule: buildFocusWeek({
      peakStart: DEFAULT_SETTINGS.peakStart,
      peakEnd: DEFAULT_SETTINGS.peakEnd,
      logoff: DEFAULT_SETTINGS.logoff,
      trackPrayers: DEFAULT_SETTINGS.trackPrayers,
    }),
    settings: { ...DEFAULT_SETTINGS },
    stats: { ...EMPTY_STATS },
    history: {},
    foodLogs: {},
    prayerLogs: {},
    reports: [],
    savedMeals: [],
    chat: null,
  };
}

export function loadLocal(): PersistedAppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    const base = emptyPersisted();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      schedule: parsed.schedule && Object.keys(parsed.schedule).length ? parsed.schedule : base.schedule,
    };
  } catch {
    return null;
  }
}

export function saveLocal(state: PersistedAppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function clearLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
