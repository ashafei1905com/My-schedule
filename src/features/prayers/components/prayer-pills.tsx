import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { PRAYER_META } from "@/features/prayers/models/prayer";
import { withPrayerTasks } from "@/features/schedule/services/schedule-service";
import { cn } from "@/shared/lib/cn";
import { formatArabicTime, formatEnglishTime } from "@/shared/lib/kuwait-time";
import { loc } from "@/shared/lib/i18n";

export function PrayerPills() {
  const lang = useAppStore((s) => s.settings.lang);
  const track = useAppStore((s) => s.settings.trackPrayers);
  const times = useAppStore((s) => s.prayerTimes);
  const done = useAppStore((s) => s.history[s.selectedDate]?.done);
  const day = useAppStore((s) => s.schedule[s.selectedJd]);
  if (!track) return null;

  const tasks = withPrayerTasks(day?.tasks ?? [], times, true);

  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-1.5">
      {PRAYER_META.map((p) => {
        const task = tasks.find((t) => t.id === `prayer-${p.key}` || t.id === p.key);
        const logged = task ? Boolean(done?.[task.id]) : false;
        const time = times[p.key];
        return (
          <div
            key={p.key}
            className={cn(
              "min-w-16 shrink-0 rounded-lg border px-2.5 py-1.5 text-center",
              logged ? "border-success/40 bg-success/10" : "border-border bg-surface",
            )}
          >
            <div className="text-[10px] font-medium text-fg-muted">{loc(lang, p.ar, p.en)}</div>
            <div className="text-xs font-semibold tabular-nums" dir="ltr">
              {lang === "ar" ? formatArabicTime(time) : formatEnglishTime(time)}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
