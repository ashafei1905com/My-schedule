import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addDaysISO,
  dateForWeekday,
  jdFromISO,
  kuwaitNowMinutes,
  todayISO,
  todayJD,
  toMinutes,
  weekStartSaturday,
} from "@/shared/lib/kuwait-time";
import { matchFoods } from "./food-db";
import { prayerTasks } from "./prayers";
import { applyBuiltDays, buildFocusWeek, cloneWeek, sortTasks } from "./templates";
import type {
  ChatMessage,
  DayLog,
  Macros,
  PrayerTimes,
  SavedMeal,
  Settings,
  Stats,
  Task,
  TaskStatus,
  WeekSchedule,
} from "./types";
import {
  DEFAULT_PRAYERS,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  EMPTY_MACROS,
  addMacros,
  emptyWeek,
} from "./types";

export interface Toast {
  id: number;
  text: string;
  kind: "ok" | "late" | "warn";
}

interface ScheduleState {
  settings: Settings;
  stats: Stats;
  schedule: WeekSchedule;
  history: Record<string, DayLog>;
  meals: SavedMeal[];
  prayers: PrayerTimes;
  viewingISO: string;
  selectedJD: number;
  chat: ChatMessage[];
  toast: Toast | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setLang: (lang: "ar" | "en") => void;
  patchSettings: (p: Partial<Settings>) => void;
  finishOnboarding: (p: {
    name: string;
    trackPrayers: boolean;
    peakStart: string;
    peakEnd: string;
    logoff: string;
    mode: "template" | "blank";
  }) => void;
  applyTemplate: () => void;
  setViewing: (iso: string) => void;
  selectDay: (jd: number) => void;
  setPrayers: (p: PrayerTimes) => void;
  completeTask: (task: Task, status?: TaskStatus) => void;
  uncompleteTask: (taskId: string) => void;
  logFood: (task: Task, text: string, macro: Macros, estimated: boolean, saveOpt: boolean) => void;
  logPrayer: (task: Task, place: string, onTime: boolean) => void;
  upsertTask: (jd: number, task: Task, days: number[]) => void;
  deleteTask: (taskId: string, days: number[]) => void;
  applyAiDays: (days: Partial<Record<number, Task[]>>) => void;
  pushChat: (m: ChatMessage) => void;
  clearChat: () => void;
  showToast: (text: string, kind?: Toast["kind"]) => void;
  clearToast: () => void;
  resetAll: () => void;
  replaySetup: () => void;
}

function emptyLog(): DayLog {
  return { done: {}, foodLog: {}, prayerLogs: {} };
}

export function requiredTask(t: Task): boolean {
  if (t.optional) return false;
  if (t.category === "snack" || t.category === "free") return false;
  return t.pts > 0;
}

function statusFor(task: Task, nowMin: number): TaskStatus {
  const start = toMinutes(task.start);
  const end = task.end ? toMinutes(task.end) : start + 40;
  if (nowMin <= end + 10) return "ontime";
  if (nowMin <= end + 180) return "late";
  return "qada";
}

function applyWeeklyReset(stats: Stats): Stats {
  const ws = weekStartSaturday(todayISO());
  if (stats.lastPtsWeekStart === ws) return stats;
  return { ...stats, pts: 0, lastPtsWeekStart: ws };
}

let toastSeq = 1;

export const useSchedule = create<ScheduleState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },
      stats: { ...DEFAULT_STATS },
      schedule: emptyWeek(),
      history: {},
      meals: [],
      prayers: { ...DEFAULT_PRAYERS },
      viewingISO: todayISO(),
      selectedJD: todayJD(),
      chat: [],
      toast: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setLang: (lang) => set({ settings: { ...get().settings, lang } }),
      patchSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      finishOnboarding: ({ name, trackPrayers, peakStart, peakEnd, logoff, mode }) => {
        const settings: Settings = {
          ...get().settings,
          name,
          trackPrayers,
          peakStart,
          peakEnd,
          logoff,
          onboarded: true,
          workspaceName: mode === "blank" ? "My board" : "Focus week",
        };
        const schedule =
          mode === "blank" ? emptyWeek() : buildFocusWeek({ peakStart, peakEnd, logoff, trackPrayers });
        set({ settings, schedule, selectedJD: todayJD(), viewingISO: todayISO() });
      },
      applyTemplate: () => {
        const s = get().settings;
        set({
          schedule: buildFocusWeek({
            peakStart: s.peakStart,
            peakEnd: s.peakEnd,
            logoff: s.logoff,
            trackPrayers: s.trackPrayers,
          }),
        });
      },
      setViewing: (iso) => set({ viewingISO: iso, selectedJD: jdFromISO(iso) }),
      selectDay: (jd) => {
        const iso = dateForWeekday(jd, get().viewingISO);
        set({ selectedJD: jd, viewingISO: iso });
      },
      setPrayers: (p) => set({ prayers: p }),
      completeTask: (task, forced) => {
        const { viewingISO, history, stats } = get();
        const nowMin = kuwaitNowMinutes();
        const status = forced ?? statusFor(task, nowMin);
        const pts =
          status === "ontime" ? task.pts : status === "late" ? Math.round(task.pts * 0.5) : Math.round(task.pts * 0.25);
        const day = history[viewingISO] ? { ...history[viewingISO] } : emptyLog();
        day.done = {
          ...day.done,
          [task.id]: { at: new Date().toISOString(), pts, status },
        };
        const nextStats = { ...stats, pts: stats.pts + pts };
        const today = todayISO();
        if (viewingISO === today) {
          const tasks = getVisibleTasks(get());
          const req = tasks.filter(requiredTask);
          const allDone = req.every((t) => day.done[t.id]);
          if (allDone && req.length) {
            if (stats.lastCompleted !== today) {
              const yest = addDaysISO(today, -1);
              const cont = stats.lastCompleted === yest;
              nextStats.cur = cont ? stats.cur + 1 : 1;
              nextStats.best = Math.max(nextStats.cur, stats.best);
              nextStats.lastCompleted = today;
            }
          }
        }
        set({ history: { ...history, [viewingISO]: day }, stats: nextStats });
      },
      uncompleteTask: (taskId) => {
        const { viewingISO, history, stats } = get();
        const day = history[viewingISO];
        if (!day?.done[taskId]) return;
        const refund = day.done[taskId].pts;
        const nextDone = { ...day.done };
        delete nextDone[taskId];
        set({
          history: { ...history, [viewingISO]: { ...day, done: nextDone } },
          stats: { ...stats, pts: Math.max(0, stats.pts - refund) },
        });
      },
      logFood: (task, text, macro, estimated, saveOpt) => {
        const { viewingISO, history, meals } = get();
        const day = history[viewingISO] ? { ...history[viewingISO] } : emptyLog();
        day.foodLog = {
          ...day.foodLog,
          [task.id]: { text, macro, at: new Date().toISOString(), estimated },
        };
        let nextMeals = meals;
        if (saveOpt && task.mealKey) {
          nextMeals = [
            ...meals.filter((m) => !(m.mealKey === task.mealKey && m.label === text)),
            { id: `${task.mealKey}-${Date.now()}`, mealKey: task.mealKey, label: text, macro },
          ].slice(-40);
        }
        set({ history: { ...history, [viewingISO]: day }, meals: nextMeals });
        get().completeTask(task);
      },
      logPrayer: (task, place, onTime) => {
        const { viewingISO, history } = get();
        const day = history[viewingISO] ? { ...history[viewingISO] } : emptyLog();
        day.prayerLogs = { ...day.prayerLogs, [task.id]: { place, onTime } };
        set({ history: { ...history, [viewingISO]: day } });
        get().completeTask(task, onTime ? "ontime" : "qada");
      },
      upsertTask: (jd, task, days) => {
        const schedule = cloneWeek(get().schedule);
        const targets = days.length ? days : [jd];
        for (const d of targets) {
          if (!schedule[d]) continue;
          const without = schedule[d].tasks.filter((t) => t.id !== task.id);
          const copy = d === jd ? task : { ...task, id: `${d}-${task.id.replace(/^\d+-/, "")}` };
          schedule[d].tasks = sortTasks([...without, copy]);
        }
        set({ schedule });
      },
      deleteTask: (taskId, days) => {
        const schedule = cloneWeek(get().schedule);
        for (const d of days) {
          if (!schedule[d]) continue;
          schedule[d].tasks = schedule[d].tasks.filter((t) => t.id !== taskId);
        }
        set({ schedule });
      },
      applyAiDays: (days) => {
        const incoming = Object.entries(days);
        const heavy = incoming.some(([, tasks]) => (tasks?.length ?? 0) >= 4);
        if (heavy) {
          set({ schedule: applyBuiltDays(get().schedule, days) });
          return;
        }
        const schedule = cloneWeek(get().schedule);
        for (const [key, tasks] of incoming) {
          const jd = Number(key);
          if (!schedule[jd] || !tasks?.length) continue;
          const byId = new Map(schedule[jd].tasks.map((t) => [t.id, t]));
          for (const t of tasks) byId.set(t.id, t);
          schedule[jd].tasks = sortTasks([...byId.values()]);
        }
        set({ schedule });
      },
      pushChat: (m) => set({ chat: [...get().chat, m].slice(-40) }),
      clearChat: () => set({ chat: [] }),
      showToast: (text, kind = "ok") => set({ toast: { id: toastSeq++, text, kind } }),
      clearToast: () => set({ toast: null }),
      resetAll: () =>
        set({
          settings: { ...DEFAULT_SETTINGS },
          stats: { ...DEFAULT_STATS },
          schedule: emptyWeek(),
          history: {},
          meals: [],
          chat: [],
          viewingISO: todayISO(),
          selectedJD: todayJD(),
        }),
      replaySetup: () => set({ settings: { ...get().settings, onboarded: false } }),
    }),
    {
      name: "nizam-smart-schedule-v1",
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        stats: s.stats,
        schedule: s.schedule,
        history: s.history,
        meals: s.meals,
        chat: s.chat,
      }),
      onRehydrateStorage: () => () => {
        const s = useSchedule.getState();
        useSchedule.setState({
          hydrated: true,
          viewingISO: todayISO(),
          selectedJD: todayJD(),
          stats: applyWeeklyReset(s.stats),
        });
      },
    },
  ),
);

export function getVisibleTasks(
  state: Pick<ScheduleState, "schedule" | "selectedJD" | "settings" | "prayers">,
): Task[] {
  const day = state.schedule[state.selectedJD] ?? emptyWeek()[state.selectedJD];
  const base = day?.tasks ?? [];
  if (!state.settings.trackPrayers) return sortTasks(base);
  const extra = prayerTasks(state.prayers, state.selectedJD === 5);
  const withoutDup = base.filter((t) => t.category !== "prayer" && t.category !== "sunrise");
  return sortTasks([...withoutDup, ...extra]);
}

export function dayMacros(log: DayLog | undefined): Macros {
  if (!log) return { ...EMPTY_MACROS };
  return Object.values(log.foodLog).reduce((acc, e) => addMacros(acc, e.macro), { ...EMPTY_MACROS });
}

export function dayStats(state: ScheduleState) {
  const tasks = getVisibleTasks(state);
  const log = state.history[state.viewingISO];
  const req = tasks.filter(requiredTask);
  const doneN = req.filter((t) => log?.done[t.id]).length;
  const pts = Object.values(log?.done ?? {}).reduce((sum, d) => sum + d.pts, 0);
  return {
    req: req.length,
    done: doneN,
    pts,
    pct: req.length ? Math.round((doneN / req.length) * 100) : 0,
  };
}

export function weekStart(iso: string): string {
  return weekStartSaturday(iso);
}

export function lookupFood(text: string) {
  return matchFoods(text);
}

export function boardContext(state: ScheduleState): string {
  const lang = state.settings.lang;
  const lines: string[] = [
    `User: ${state.settings.name || "friend"}`,
    `Lang: ${lang}`,
    `Peak: ${state.settings.peakStart}-${state.settings.peakEnd}`,
    `Log-off: ${state.settings.logoff}`,
    `Track prayers: ${state.settings.trackPrayers}`,
    `City: ${state.settings.city}, ${state.settings.country}`,
    `Prayer times: ${JSON.stringify(state.prayers)}`,
  ];
  for (let jd = 0; jd < 7; jd++) {
    const d = state.schedule[jd];
    const names = d.tasks
      .map((t) => `${t.start}${t.end ? "-" + t.end : ""} ${lang === "ar" ? t.nameAr : t.name} [${t.category}/${t.pts}]`)
      .join("; ");
    lines.push(`jd${jd} ${d.name}: ${names || "(empty)"}`);
  }
  return lines.join("\n");
}
