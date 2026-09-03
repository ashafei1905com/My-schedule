import type { HistoryMap, WeeklyReport } from "@/features/history/models/day-log";
import type { DoneMap, Task, WeekSchedule } from "@/features/schedule/models/task";
import { requiredTasks } from "@/features/schedule/services/schedule-service";
import { addDaysISO, dateForWeekday, jdFromISO, weekStartSaturday } from "@/shared/lib/kuwait-time";

export function upsertDayLog(history: HistoryMap, date: string, done: DoneMap): HistoryMap {
  const prev = history[date];
  return {
    ...history,
    [date]: { done, penalty: prev?.penalty ?? null },
  };
}

export function buildWeeklyReport(
  week: WeekSchedule,
  history: HistoryMap,
  weekStart: string,
  pts: number,
): WeeklyReport {
  let daysCompleted = 0;
  let tasksDone = 0;
  let tasksMissed = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(weekStart, i);
    const jd = jdFromISO(date);
    const tasks = week[jd]?.tasks ?? [];
    const req = requiredTasks(tasks);
    const done = history[date]?.done ?? {};
    const completed = req.filter((t) => done[t.id]).length;
    tasksDone += completed;
    tasksMissed += req.length - completed;
    if (req.length > 0 && completed === req.length) daysCompleted += 1;
  }
  return {
    weekStart,
    totalPts: pts,
    daysCompleted,
    tasksDone,
    tasksMissed,
    generatedAt: new Date().toISOString(),
  };
}

export function lastNDays(
  history: HistoryMap,
  week: WeekSchedule,
  today: string,
  n = 14,
): { date: string; jd: number; done: number; total: number; tasks: Task[] }[] {
  const out = [];
  for (let i = 0; i < n; i++) {
    const date = addDaysISO(today, -i);
    const jd = jdFromISO(date);
    const tasks = week[jd]?.tasks ?? [];
    const req = requiredTasks(tasks);
    const doneMap = history[date]?.done ?? {};
    out.push({
      date,
      jd,
      done: req.filter((t) => doneMap[t.id]).length,
      total: req.length,
      tasks,
    });
  }
  return out;
}

export { dateForWeekday, weekStartSaturday };
