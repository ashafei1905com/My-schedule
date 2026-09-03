export const CATEGORIES = [
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

export type Category = (typeof CATEGORIES)[number];

export type GymDay = "upper" | "lower" | null;

export type TaskStatus = "ontime" | "late" | "qada";

export interface Macros {
  p: number;
  c: number;
  f: number;
  b: number;
  k: number;
}

export interface Task {
  id: string;
  start: string;
  end?: string;
  category: Category;
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

export interface FoodEntry {
  text: string;
  macro: Macros;
  at: string;
  estimated?: boolean;
}

export interface PrayerEntry {
  place: string;
  onTime: boolean;
}

export interface DayLog {
  done: Record<string, DoneEntry>;
  foodLog: Record<string, FoodEntry>;
  prayerLogs: Record<string, PrayerEntry>;
}

export interface Stats {
  pts: number;
  cur: number;
  best: number;
  lastCompleted: string | null;
  lastFailed: string | null;
  lastPtsWeekStart: string | null;
}

export interface Settings {
  lang: "ar" | "en";
  name: string;
  workspaceName: string;
  trackPrayers: boolean;
  showTracking: boolean;
  onboarded: boolean;
  city: string;
  country: string;
  kcalTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
  peakStart: string;
  peakEnd: string;
  logoff: string;
}

export interface SavedMeal {
  id: string;
  mealKey: string;
  label: string;
  macro: Macros;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export const EMPTY_MACROS: Macros = { p: 0, c: 0, f: 0, b: 0, k: 0 };

export const DEFAULT_PRAYERS: PrayerTimes = {
  Fajr: "03:13",
  Sunrise: "04:50",
  Dhuhr: "11:51",
  Asr: "15:25",
  Maghrib: "18:51",
  Isha: "20:26",
};

export const DEFAULT_SETTINGS: Settings = {
  lang: "en",
  name: "",
  workspaceName: "Focus week",
  trackPrayers: true,
  showTracking: true,
  onboarded: false,
  city: "Kuwait",
  country: "Kuwait",
  kcalTarget: 2200,
  proteinTarget: 160,
  carbsTarget: 220,
  fatTarget: 70,
  fiberTarget: 30,
  peakStart: "08:00",
  peakEnd: "11:00",
  logoff: "17:30",
};

export const DEFAULT_STATS: Stats = {
  pts: 0,
  cur: 0,
  best: 0,
  lastCompleted: null,
  lastFailed: null,
  lastPtsWeekStart: null,
};

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    p: a.p + b.p,
    c: a.c + b.c,
    f: a.f + b.f,
    b: a.b + b.b,
    k: a.k + b.k,
  };
}

export function emptyWeek(): WeekSchedule {
  const names = [
    ["Sunday", "الأحد"],
    ["Monday", "الاثنين"],
    ["Tuesday", "الثلاثاء"],
    ["Wednesday", "الأربعاء"],
    ["Thursday", "الخميس"],
    ["Friday", "الجمعة"],
    ["Saturday", "السبت"],
  ];
  const week: WeekSchedule = {};
  for (let i = 0; i < 7; i++) {
    week[i] = {
      name: names[i][0],
      nameAr: names[i][1],
      wake: "07:00",
      bed: "23:00",
      gym: null,
      tasks: [],
    };
  }
  return week;
}
