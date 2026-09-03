import type { Macros } from "./macros";

export interface FoodItem {
  name: string;
  qty?: number | null;
  unit?: string | null;
  kcal?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
  estimated?: boolean;
}

export interface FoodLogEntry {
  mealKey: string;
  taskId: string;
  items: FoodItem[];
  macro: Macros;
  source: "planned" | "logged";
  at: string;
  estimated?: boolean;
}

export type FoodLogsByDate = Record<string, Record<string, FoodLogEntry>>;

export interface SavedMeal {
  id: string;
  mealKey: string;
  label: string;
  labelAr?: string;
  macro: Macros;
}
