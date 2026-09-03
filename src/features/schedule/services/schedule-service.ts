import type { PrayerTimes } from "@/features/prayers/models/prayer";
import { PRAYER_META } from "@/features/prayers/models/prayer";
import type { DoneMap, Task, TaskStatus, WeekSchedule } from "@/features/schedule/models/task";
import { sortTasks } from "@/features/schedule/services/template-service";
import { kuwaitNowMinutes, toMinutes } from "@/shared/lib/kuwait-time";

export function taskEndMinutes(task: Task): number {
  if (task.end) return toMinutes(task.end);
  return toMinutes(task.start) + 30;
}

export function isCurrentTask(task: Task, nowMins = kuwaitNowMinutes()): boolean {
  const start = toMinutes(task.start);
  const end = taskEndMinutes(task);
  if (end < start) return nowMins >= start || nowMins < end;
  return nowMins >= start && nowMins < end;
}

export function currentTaskId(tasks: Task[], nowMins = kuwaitNowMinutes()): string | null {
  const hit = tasks.find((t) => isCurrentTask(t, nowMins));
  return hit?.id ?? null;
}

export function nextTask(tasks: Task[], nowMins = kuwaitNowMinutes()): Task | null {
  const upcoming = tasks
    .filter((t) => toMinutes(t.start) > nowMins)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  return upcoming[0] ?? null;
}

export function requiredTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.optional && t.category !== "sunrise");
}

export function completionKind(task: Task, nowMins = kuwaitNowMinutes()): TaskStatus {
  const end = taskEndMinutes(task);
  const start = toMinutes(task.start);
  if (nowMins <= end + 15) return "ontime";
  if (nowMins <= start + 24 * 60) return "late";
  return "qada";
}

export function dayProgress(tasks: Task[], done: DoneMap): { done: number; total: number; pts: number } {
  const req = requiredTasks(tasks);
  const completed = req.filter((t) => done[t.id]);
  const pts = Object.values(done).reduce((s, d) => s + (d.pts || 0), 0);
  return { done: completed.length, total: req.length, pts };
}

export function upsertTask(week: WeekSchedule, jd: number, task: Task): WeekSchedule {
  const next = JSON.parse(JSON.stringify(week)) as WeekSchedule;
  const day = next[jd];
  if (!day) return week;
  const idx = day.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) day.tasks[idx] = task;
  else day.tasks.push(task);
  day.tasks = sortTasks(day.tasks);
  return next;
}

export function removeTask(week: WeekSchedule, jd: number, taskId: string): WeekSchedule {
  const next = JSON.parse(JSON.stringify(week)) as WeekSchedule;
  const day = next[jd];
  if (!day) return week;
  day.tasks = day.tasks.filter((t) => t.id !== taskId);
  return next;
}

export function withPrayerTasks(tasks: Task[], times: PrayerTimes, track: boolean): Task[] {
  if (!track) return tasks.filter((t) => t.category !== "prayer");
  const existing = new Set(tasks.filter((t) => t.category === "prayer").map((t) => t.id));
  const injected: Task[] = [];
  for (const meta of PRAYER_META) {
    const id = `prayer-${meta.key}`;
    if (existing.has(id) || existing.has(meta.key)) continue;
    const start = times[meta.key];
    if (!start) continue;
    injected.push({
      id,
      start,
      end: addMinutes(start, 20),
      category: "prayer",
      name: meta.en,
      nameAr: meta.ar,
      desc: meta.sunnahEn ?? "",
      descAr: meta.sunnahAr ?? "",
      pts: meta.points,
      notify: true,
    });
  }
  return sortTasks([...tasks.filter((t) => t.category !== "prayer"), ...injected]);
}

function addMinutes(hhmm: string, minutes: number): string {
  const total = toMinutes(hhmm) + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function newTaskId(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
