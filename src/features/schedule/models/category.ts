import type { TaskCategory } from "./task";

export const CATEGORY_COLOR: Record<TaskCategory, string> = {
  prayer: "var(--color-cat-prayer)",
  food: "var(--color-cat-food)",
  gym: "var(--color-cat-gym)",
  swim: "var(--color-cat-swim)",
  recovery: "var(--color-cat-recovery)",
  quran: "var(--color-cat-quran)",
  prog: "var(--color-cat-prog)",
  sleep: "var(--color-cat-sleep)",
  free: "var(--color-cat-free)",
  snack: "var(--color-cat-snack)",
  sunrise: "var(--color-cat-sunrise)",
  work: "var(--color-cat-prog)",
  admin: "var(--color-cat-free)",
};

export const CATEGORY_ICON: Record<TaskCategory, string> = {
  prayer: "Moon",
  food: "Utensils",
  gym: "Dumbbell",
  swim: "Waves",
  recovery: "HeartPulse",
  quran: "BookOpen",
  prog: "Code2",
  sleep: "MoonStar",
  free: "Coffee",
  snack: "Apple",
  sunrise: "Sunrise",
  work: "Briefcase",
  admin: "Inbox",
};
