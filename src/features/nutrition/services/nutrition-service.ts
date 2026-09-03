import type { FoodLogEntry, FoodLogsByDate } from "@/features/nutrition/models/food-log";
import {
  addMacros,
  EMPTY_MACROS,
  roundMacros,
  scaleMacros,
  type Macros,
} from "@/features/nutrition/models/macros";
import type { Task } from "@/features/schedule/models/task";

/** Per-100g baselines for common kitchen foods (Arabic + English keys). */
const FOOD_DB: { keys: string[]; per100: Macros }[] = [
  { keys: ["chicken", "صدر", "دجاج"], per100: { p: 31, c: 0, f: 3.6, b: 0, k: 165 } },
  { keys: ["rice", "رز", "أرز"], per100: { p: 2.7, c: 28, f: 0.3, b: 0.4, k: 130 } },
  { keys: ["bread", "عيش", "توست", "رغيف"], per100: { p: 9, c: 49, f: 3.2, b: 7, k: 265 } },
  { keys: ["egg", "بيض"], per100: { p: 13, c: 1.1, f: 11, b: 0, k: 155 } },
  { keys: ["cottage", "قريش"], per100: { p: 11, c: 3.4, f: 4.3, b: 0, k: 98 } },
  { keys: ["fava", "فول"], per100: { p: 8, c: 19, f: 0.7, b: 5, k: 110 } },
  { keys: ["oat", "شوفان"], per100: { p: 13, c: 67, f: 7, b: 10, k: 389 } },
  { keys: ["banana", "موز"], per100: { p: 1.1, c: 23, f: 0.3, b: 2.6, k: 89 } },
  { keys: ["peanut", "فول سوداني", "زبدة"], per100: { p: 25, c: 20, f: 50, b: 6, k: 588 } },
  { keys: ["cucumber", "خيار"], per100: { p: 0.7, c: 3.6, f: 0.1, b: 0.5, k: 16 } },
  { keys: ["tomato", "طماطم"], per100: { p: 0.9, c: 3.9, f: 0.2, b: 1.2, k: 18 } },
  { keys: ["milk", "لبن", "حليب"], per100: { p: 3.4, c: 5, f: 3.3, b: 0, k: 61 } },
  { keys: ["nuts", "مكسرات", "لوز"], per100: { p: 21, c: 22, f: 49, b: 12, k: 607 } },
  { keys: ["apple", "تفاح", "فاكهة"], per100: { p: 0.3, c: 14, f: 0.2, b: 2.4, k: 52 } },
  { keys: ["olive", "زيتون"], per100: { p: 0, c: 0, f: 100, b: 0, k: 884 } },
  { keys: ["salad", "سلطة"], per100: { p: 1.2, c: 4, f: 0.2, b: 1.8, k: 20 } },
  { keys: ["yogurt", "زبادي"], per100: { p: 10, c: 3.6, f: 0.4, b: 0, k: 59 } },
  { keys: ["tuna", "تونة"], per100: { p: 26, c: 0, f: 1, b: 0, k: 116 } },
  { keys: ["potato", "بطاطس"], per100: { p: 2, c: 17, f: 0.1, b: 2.2, k: 77 } },
  { keys: ["dates", "تمر"], per100: { p: 2.5, c: 75, f: 0.4, b: 8, k: 282 } },
];

function parseGrams(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(g|جم|غرام|grams?)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 20 && n < 1500) return n;
  return null;
}

export function estimateFromLocalDb(text: string): { macro: Macros; items: { name: string; grams: number }[]; matched: boolean } {
  const lower = text.toLowerCase();
  let macro = { ...EMPTY_MACROS };
  const items: { name: string; grams: number }[] = [];
  for (const row of FOOD_DB) {
    if (!row.keys.some((k) => lower.includes(k.toLowerCase()))) continue;
    const grams = parseGrams(text) ?? 120;
    const scaled = scaleMacros(row.per100, grams / 100);
    macro = addMacros(macro, scaled);
    items.push({ name: row.keys[0], grams });
  }
  return { macro: roundMacros(macro), items, matched: items.length > 0 };
}

export function plannedEntry(task: Task, at: string): FoodLogEntry | null {
  if (!task.targetMacros) return null;
  return {
    mealKey: task.mealKey ?? task.id,
    taskId: task.id,
    items: [{ name: task.name, kcal: task.targetMacros.k }],
    macro: task.targetMacros,
    source: "planned",
    at,
  };
}

export function dayMacros(logs: Record<string, FoodLogEntry> | undefined): Macros {
  if (!logs) return { ...EMPTY_MACROS };
  return roundMacros(Object.values(logs).reduce((acc, e) => addMacros(acc, e.macro), { ...EMPTY_MACROS }));
}

export function upsertFoodLog(
  all: FoodLogsByDate,
  date: string,
  entry: FoodLogEntry,
): FoodLogsByDate {
  const day = { ...(all[date] || {}), [entry.taskId]: entry };
  return { ...all, [date]: day };
}

export function pct(value: number, target: number): number {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}
