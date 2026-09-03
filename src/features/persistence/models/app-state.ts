import type { ChatSession } from "@/features/assistant/models/chat";
import type { HistoryMap, WeeklyReport } from "@/features/history/models/day-log";
import type { FoodLogsByDate, SavedMeal } from "@/features/nutrition/models/food-log";
import type { Stats } from "@/features/points/models/stats";
import type { PrayerLogsByDate } from "@/features/prayers/models/prayer";
import type { WeekSchedule } from "@/features/schedule/models/task";
import type { UserSettings } from "@/features/settings/models/user-settings";

export interface PersistedAppState {
  schedule: WeekSchedule;
  settings: UserSettings;
  stats: Stats;
  history: HistoryMap;
  foodLogs: FoodLogsByDate;
  prayerLogs: PrayerLogsByDate;
  reports: WeeklyReport[];
  savedMeals: SavedMeal[];
  chat: ChatSession | null;
}

export const STORAGE_KEY = "smart-schedule.v1";
