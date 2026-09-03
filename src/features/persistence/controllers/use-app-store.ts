import { toast } from "sonner";
import { create } from "zustand";
import { askAssistant } from "@/features/assistant/services/assistant-service";
import type { ChatMessage, ChatSession } from "@/features/assistant/models/chat";
import { buildWeeklyReport, upsertDayLog } from "@/features/history/services/history-service";
import type { FoodLogEntry } from "@/features/nutrition/models/food-log";
import { estimateMacrosRemote } from "@/features/nutrition/services/estimate-macros";
import {
  estimateFromLocalDb,
  plannedEntry,
  upsertFoodLog,
} from "@/features/nutrition/services/nutrition-service";
import { applyOnboarding } from "@/features/onboarding/services/onboarding-service";
import type { OnboardingAnswers } from "@/features/onboarding/models/onboarding";
import type { PersistedAppState } from "@/features/persistence/models/app-state";
import { loadCloudState, saveCloudState } from "@/features/persistence/services/cloud-store";
import { emptyPersisted, loadLocal, saveLocal } from "@/features/persistence/services/local-store";
import {
  applyMissedPenalty,
  applyStreak,
  mergeHistory,
  mergeStats,
  resetWeeklyPointsIfNewWeek,
} from "@/features/points/services/points-service";
import {
  canRebirth,
  getRankMeta,
  performRebirth,
} from "@/features/points/services/rank-service";
import type { PrayerLog, PrayerTimes } from "@/features/prayers/models/prayer";
import { FALLBACK_PRAYER_TIMES } from "@/features/prayers/models/prayer";
import { fetchPrayerTimes } from "@/features/prayers/services/prayer-times-service";
import type { Task } from "@/features/schedule/models/task";
import { completeTask, uncompleteTask } from "@/features/schedule/services/completion-service";
import {
  newTaskId,
  removeTask,
  upsertTask,
  withPrayerTasks,
} from "@/features/schedule/services/schedule-service";
import { applyBuiltDays, buildFocusWeek, sortTasks } from "@/features/schedule/services/template-service";
import { MYTHIC_THEMES } from "@/features/settings/models/themes";
import type { UserSettings } from "@/features/settings/models/user-settings";
import { addDaysISO, todayISO, todayJD, weekStartSaturday } from "@/shared/lib/kuwait-time";

export interface AppStore extends PersistedAppState {
  hydrated: boolean;
  selectedJd: number;
  selectedDate: string;
  prayerTimes: PrayerTimes;
  syncing: boolean;
  signedIn: boolean;
  hydrate: (signedIn: boolean) => Promise<void>;
  persist: () => void;
  selectDay: (jd: number, date: string) => void;
  complete: (task: Task) => { status: string; pts: number };
  uncomplete: (taskId: string) => void;
  saveTask: (jd: number, task: Task, days?: number[]) => void;
  deleteTask: (jd: number, taskId: string) => void;
  logFood: (task: Task, entry: FoodLogEntry) => void;
  logPlannedFood: (task: Task) => void;
  estimateFood: (text: string) => Promise<{ ok: boolean; entry?: Omit<FoodLogEntry, "taskId" | "mealKey" | "at">; error?: string }>;
  logPrayer: (taskId: string, log: PrayerLog) => void;
  patchSettings: (patch: Partial<UserSettings>) => void;
  finishOnboarding: (answers: OnboardingAnswers) => void;
  replayOnboarding: () => void;
  applyTemplate: () => void;
  resetLocal: () => void;
  sendAssistant: (text: string) => Promise<void>;
  clearChat: () => void;
  doRebirth: () => boolean;
  unlockMythic: (id: string) => boolean;
  activateMythic: (id: string | null) => void;
}

function snapshot(s: AppStore): PersistedAppState {
  return {
    schedule: s.schedule,
    settings: s.settings,
    stats: s.stats,
    history: s.history,
    foodLogs: s.foodLogs,
    prayerLogs: s.prayerLogs,
    reports: s.reports,
    savedMeals: s.savedMeals,
    chat: s.chat,
  };
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null;

function queueCloud(get: () => AppStore) {
  if (!get().signedIn) return;
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    const s = get();
    s.syncing = true;
    void saveCloudState({ data: snapshot(s) })
      .catch(() => undefined)
      .finally(() => {
        useAppStore.setState({ syncing: false });
      });
  }, 900);
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...emptyPersisted(),
  hydrated: false,
  selectedJd: todayJD(),
  selectedDate: todayISO(),
  prayerTimes: FALLBACK_PRAYER_TIMES,
  syncing: false,
  signedIn: false,

  persist: () => {
    const s = get();
    saveLocal(snapshot(s));
    queueCloud(get);
  },

  hydrate: async (signedIn) => {
    if (get().hydrated && get().signedIn === signedIn) return;
    const local = loadLocal() ?? emptyPersisted();
    let merged = local;
    if (signedIn) {
      try {
        const cloud = await loadCloudState();
        if (cloud) {
          const cloudEmpty = !cloud.schedule || Object.keys(cloud.schedule).length === 0;
          merged = {
            ...local,
            ...cloud,
            settings: { ...local.settings, ...(cloud.settings || {}) },
            stats: mergeStats(local.stats, cloud.stats),
            history: mergeHistory(local.history, cloud.history),
            foodLogs: { ...(local.foodLogs || {}), ...(cloud.foodLogs || {}) },
            prayerLogs: { ...(local.prayerLogs || {}), ...(cloud.prayerLogs || {}) },
            schedule: cloudEmpty ? local.schedule : cloud.schedule,
            reports: (cloud.reports?.length ? cloud.reports : local.reports) ?? [],
            savedMeals: cloud.savedMeals?.length ? cloud.savedMeals : local.savedMeals,
            chat: cloud.chat ?? local.chat,
          };
        }
      } catch {
        /* stay local */
      }
    }

    const today = todayISO();
    const jd = todayJD();
    let stats = resetWeeklyPointsIfNewWeek(merged.stats, today);
    stats = {
      ...stats,
      lastRankKey: stats.lastRankKey || getRankMeta(stats.lifetime_xp || 0).key,
      unlockedThemes: stats.unlockedThemes || [],
    };
    const yesterday = addDaysISO(today, -1);
    const yJd = (jd + 6) % 7;
    const yTasks = merged.schedule[yJd]?.tasks ?? [];
    const yDone = merged.history[yesterday]?.done ?? {};
    const already = Boolean(merged.history[yesterday]?.penalty);
    const penalized = applyMissedPenalty(yTasks, yDone, stats, already, yesterday);
    stats = penalized.stats;
    const history = { ...merged.history };
    if (penalized.penalty) {
      history[yesterday] = {
        done: yDone,
        penalty: penalized.penalty,
      };
    }

    let times = FALLBACK_PRAYER_TIMES;
    try {
      times = await fetchPrayerTimes(merged.settings.city, merged.settings.country, today);
    } catch {
      /* fallback */
    }

    set({
      ...merged,
      stats,
      history,
      signedIn,
      selectedJd: jd,
      selectedDate: today,
      prayerTimes: times,
      hydrated: true,
    });
    get().persist();
  },

  selectDay: (jd, date) => set({ selectedJd: jd, selectedDate: date }),

  complete: (task) => {
    const s = get();
    const date = s.selectedDate;
    const done = s.history[date]?.done ?? {};
    const result = completeTask(task, done, s.stats);
    const history = upsertDayLog(s.history, date, result.done);
    const dayTasks = withPrayerTasks(
      s.schedule[s.selectedJd]?.tasks ?? [],
      s.prayerTimes,
      s.settings.trackPrayers,
    );
    const stats = applyStreak(dayTasks, result.done, result.stats, date);
    set({ history, stats });
    get().persist();
    if (result.rankedUp) {
      const name = s.settings.lang === "en" ? result.rankedUp.title : result.rankedUp.titleAr;
      toast.success(`${result.rankedUp.icon} ${name}`);
    }
    return { status: result.entry.status, pts: result.entry.pts };
  },

  uncomplete: (taskId) => {
    const s = get();
    const date = s.selectedDate;
    const done = s.history[date]?.done ?? {};
    const result = uncompleteTask(taskId, done, s.stats);
    const history = upsertDayLog(s.history, date, result.done);
    set({ history, stats: result.stats });
    get().persist();
  },

  saveTask: (jd, task, days) => {
    const s = get();
    let week = s.schedule;
    const targets = days && days.length ? days : [jd];
    for (const d of targets) {
      const copy: Task = d === jd ? task : { ...task, id: newTaskId() };
      week = upsertTask(week, d, copy);
    }
    set({ schedule: week });
    get().persist();
  },

  deleteTask: (jd, taskId) => {
    set({ schedule: removeTask(get().schedule, jd, taskId) });
    get().persist();
  },

  logFood: (task, entry) => {
    const s = get();
    const foodLogs = upsertFoodLog(s.foodLogs, s.selectedDate, {
      ...entry,
      taskId: task.id,
      mealKey: task.mealKey ?? task.id,
    });
    set({ foodLogs });
    get().complete(task);
  },

  logPlannedFood: (task) => {
    const entry = plannedEntry(task, get().selectedDate);
    if (!entry) {
      get().complete(task);
      return;
    }
    get().logFood(task, entry);
  },

  estimateFood: async (text) => {
    const local = estimateFromLocalDb(text);
    if (local.matched) {
      return {
        ok: true,
        entry: {
          items: local.items.map((i) => ({ name: i.name, qty: i.grams, unit: "g", kcal: undefined })),
          macro: local.macro,
          source: "logged" as const,
          estimated: false,
        },
      };
    }
    try {
      const remote = await estimateMacrosRemote({ data: { text } });
      if (!remote.ok) return { ok: false, error: remote.error };
      return {
        ok: true,
        entry: {
          items: [{ name: remote.name, qty: remote.grams, unit: "g", kcal: remote.macro.k, estimated: true }],
          macro: remote.macro,
          source: "logged" as const,
          estimated: true,
        },
      };
    } catch {
      return { ok: false, error: "unavailable" };
    }
  },

  logPrayer: (taskId, log) => {
    const s = get();
    const day = { ...(s.prayerLogs[s.selectedDate] || {}), [taskId]: log };
    set({ prayerLogs: { ...s.prayerLogs, [s.selectedDate]: day } });
    const tasks = withPrayerTasks(
      s.schedule[s.selectedJd]?.tasks ?? [],
      s.prayerTimes,
      s.settings.trackPrayers,
    );
    const task = tasks.find((t) => t.id === taskId);
    if (task) get().complete(task);
    else get().persist();
  },

  patchSettings: (patch) => {
    set({ settings: { ...get().settings, ...patch } });
    get().persist();
  },

  finishOnboarding: (answers) => {
    const { schedule, settings } = applyOnboarding(answers);
    set({
      schedule,
      settings: { ...get().settings, ...settings, lang: get().settings.lang || "en" },
      selectedJd: todayJD(),
      selectedDate: todayISO(),
    });
    get().persist();
  },

  replayOnboarding: () => {
    set({ settings: { ...get().settings, onboardingComplete: false } });
    get().persist();
  },

  applyTemplate: () => {
    const s = get();
    const schedule = buildFocusWeek({
      peakStart: s.settings.peakStart,
      peakEnd: s.settings.peakEnd,
      logoff: s.settings.logoff,
      trackPrayers: s.settings.trackPrayers,
    });
    set({ schedule });
    get().persist();
  },

  resetLocal: () => {
    const empty = emptyPersisted();
    set({ ...empty, hydrated: true, selectedJd: todayJD(), selectedDate: todayISO() });
    get().persist();
  },

  doRebirth: () => {
    const s = get();
    if (!canRebirth(s.stats)) return false;
    set({ stats: performRebirth(s.stats) });
    get().persist();
    return true;
  },

  unlockMythic: (id) => {
    const s = get();
    const theme = MYTHIC_THEMES.find((t) => t.id === id);
    if (!theme) return false;
    const unlocked = new Set(s.stats.unlockedThemes || []);
    if (unlocked.has(id)) return true;
    if ((s.stats.rebirth_tokens || 0) < theme.cost) return false;
    unlocked.add(id);
    set({
      stats: {
        ...s.stats,
        rebirth_tokens: s.stats.rebirth_tokens - theme.cost,
        unlockedThemes: [...unlocked],
      },
    });
    get().persist();
    return true;
  },

  activateMythic: (id) => {
    const s = get();
    if (id && !(s.stats.unlockedThemes || []).includes(id)) return;
    set({ stats: { ...s.stats, activeMythicTheme: id } });
    get().persist();
  },

  sendAssistant: async (text) => {
    const s = get();
    const now = new Date().toISOString();
    const userMsg: ChatMessage = { id: newTaskId(), role: "user", content: text, at: now };
    const prev: ChatSession = s.chat ?? { id: newTaskId(), title: text.slice(0, 40), messages: [], updatedAt: now };
    const session: ChatSession = { ...prev, messages: [...prev.messages, userMsg], updatedAt: now };
    set({ chat: session });

    const day = s.schedule[s.selectedJd];
    const context = JSON.stringify({
      date: s.selectedDate,
      jd: s.selectedJd,
      settings: {
        peakStart: s.settings.peakStart,
        peakEnd: s.settings.peakEnd,
        logoff: s.settings.logoff,
        trackPrayers: s.settings.trackPrayers,
        lang: s.settings.lang,
      },
      day,
    });

    try {
      const res = await askAssistant({
        data: {
          messages: session.messages.map((m) => ({ role: m.role, content: m.content })),
          context,
        },
      });
      const reply = res.ok ? res.text : s.settings.lang === "ar" ? "المساعد غير متاح حالياً." : "Assistant is unavailable right now.";
      const assistantMsg: ChatMessage = { id: newTaskId(), role: "assistant", content: reply, at: new Date().toISOString() };
      const nextSession = { ...session, messages: [...session.messages, assistantMsg], updatedAt: assistantMsg.at };
      let schedule = s.schedule;
      const fence = reply.match(/```json\s*([\s\S]*?)```/);
      if (fence) {
        try {
          const parsed = JSON.parse(fence[1]) as {
            action?: string;
            jd?: number;
            tasks?: Task[];
          };
          if (parsed.action === "patch-day" && typeof parsed.jd === "number" && Array.isArray(parsed.tasks)) {
            const tasks = sortTasks(
              parsed.tasks.map((t) => ({
                ...t,
                notify: t.notify ?? true,
                optional: t.optional ?? false,
                nameAr: t.nameAr || t.name,
                descAr: t.descAr || t.desc || "",
                desc: t.desc || "",
                pts: t.pts || 10,
                id: t.id || newTaskId(),
              })),
            );
            schedule = applyBuiltDays(schedule, { [parsed.jd]: tasks });
          }
        } catch {
          /* ignore bad json */
        }
      }
      set({ chat: nextSession, schedule });
      get().persist();
    } catch {
      const assistantMsg: ChatMessage = {
        id: newTaskId(),
        role: "assistant",
        content: s.settings.lang === "ar" ? "المساعد غير متاح حالياً." : "Assistant is unavailable right now.",
        at: new Date().toISOString(),
      };
      set({ chat: { ...session, messages: [...session.messages, assistantMsg] } });
    }
  },

  clearChat: () => {
    set({ chat: null });
    get().persist();
  },
}));

export function useLang() {
  return useAppStore((s) => s.settings.lang);
}

export function todayDoneMap() {
  const s = useAppStore.getState();
  return s.history[s.selectedDate]?.done ?? {};
}

export function buildReportNow() {
  const s = useAppStore.getState();
  return buildWeeklyReport(s.schedule, s.history, weekStartSaturday(s.selectedDate), s.stats.pts);
}
