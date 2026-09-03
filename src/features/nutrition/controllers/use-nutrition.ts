import { dayMacros } from "@/features/nutrition/services/nutrition-service";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function useNutrition() {
  const logs = useAppStore((s) => s.foodLogs[s.selectedDate]);
  const settings = useAppStore((s) => s.settings);
  return { logs, macros: dayMacros(logs), settings };
}
