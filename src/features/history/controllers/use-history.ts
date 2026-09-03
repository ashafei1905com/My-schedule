import { lastNDays } from "@/features/history/services/history-service";
import { buildReportNow, useAppStore } from "@/features/persistence/controllers/use-app-store";

export function useHistory() {
  const history = useAppStore((s) => s.history);
  const week = useAppStore((s) => s.schedule);
  const today = useAppStore((s) => s.selectedDate);
  return { history, days: lastNDays(history, week, today, 14), report: buildReportNow() };
}
