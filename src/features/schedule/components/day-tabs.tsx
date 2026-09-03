import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { dateForWeekday, todayISO, todayJD, weekStartSaturday } from "@/shared/lib/kuwait-time";
import { cn } from "@/shared/lib/cn";
import { dayName } from "@/shared/lib/i18n";

export function DayTabs() {
  const lang = useAppStore((s) => s.settings.lang);
  const selectedJd = useAppStore((s) => s.selectedJd);
  const selectDay = useAppStore((s) => s.selectDay);
  const today = todayISO();
  const todayJ = todayJD();
  const start = weekStartSaturday(today);

  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-1.5">
      {[6, 0, 1, 2, 3, 4, 5].map((jd) => {
        const date = dateForWeekday(jd, today);
        const active = selectedJd === jd;
        const isToday = jd === todayJ;
        return (
          <button
            key={jd}
            type="button"
            onClick={() => selectDay(jd, date)}
            className={cn(
              "flex min-w-14 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-fg"
                : isToday
                  ? "border-success/50 bg-surface text-success"
                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            <span>{dayName(lang, jd, true)}</span>
            {isToday ? <span className="mt-0.5 size-1 rounded-full bg-current opacity-70" /> : null}
          </button>
        );
      })}
      </div>
      <span className="sr-only">{start}</span>
    </div>
  );
}
