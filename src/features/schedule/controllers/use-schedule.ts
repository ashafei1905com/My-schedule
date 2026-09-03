import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { withPrayerTasks } from "@/features/schedule/services/schedule-service";

export function useSchedule() {
  const schedule = useAppStore((s) => s.schedule);
  const selectedJd = useAppStore((s) => s.selectedJd);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const prayerTimes = useAppStore((s) => s.prayerTimes);
  const trackPrayers = useAppStore((s) => s.settings.trackPrayers);
  const saveTask = useAppStore((s) => s.saveTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const selectDay = useAppStore((s) => s.selectDay);
  const day = schedule[selectedJd];
  const tasks = withPrayerTasks(day?.tasks ?? [], prayerTimes, trackPrayers);
  return { schedule, selectedJd, selectedDate, day, tasks, saveTask, deleteTask, selectDay };
}
