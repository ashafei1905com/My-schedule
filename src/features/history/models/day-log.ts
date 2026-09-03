import type { PenaltyRecord } from "@/features/points/models/stats";
import type { DoneMap } from "@/features/schedule/models/task";

export interface DayLog {
  done: DoneMap;
  penalty: PenaltyRecord | null;
}

export type HistoryMap = Record<string, DayLog>;

export interface WeeklyReport {
  weekStart: string;
  totalPts: number;
  daysCompleted: number;
  tasksDone: number;
  tasksMissed: number;
  generatedAt: string;
}
