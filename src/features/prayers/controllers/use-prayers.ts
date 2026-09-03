import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function usePrayers() {
  const times = useAppStore((s) => s.prayerTimes);
  const logs = useAppStore((s) => s.prayerLogs[s.selectedDate]);
  const track = useAppStore((s) => s.settings.trackPrayers);
  return { times, logs, track };
}
