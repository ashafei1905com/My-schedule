import type { Macros } from "@/features/nutrition/models/macros";

export const TASK_CATEGORIES = [
  "prayer",
  "food",
  "gym",
  "swim",
  "recovery",
  "quran",
  "prog",
  "sleep",
  "free",
  "snack",
  "sunrise",
  "work",
  "admin",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type GymDay = "upper" | "lower" | null;

export type TaskStatus = "ontime" | "late" | "qada";

export interface Task {
  id: string;
  start: string;
  end?: string;
  category: TaskCategory;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  pts: number;
  notify: boolean;
  optional?: boolean;
  foodLog?: boolean;
  mealKey?: string;
  targetMacros?: Macros;
  isException?: boolean;
  homework?: string | null;
}

export interface DaySchedule {
  name: string;
  nameAr: string;
  wake: string;
  bed: string;
  gym: GymDay;
  tasks: Task[];
}

export type WeekSchedule = Record<number, DaySchedule>;

export interface DoneEntry {
  at: string;
  pts: number;
  status: TaskStatus;
}

export type DoneMap = Record<string, DoneEntry>;
