import { Plus } from "lucide-react";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import type { DoneMap } from "@/features/schedule/models/task";
import { dayProgress, withPrayerTasks } from "@/features/schedule/services/schedule-service";
import { loc, t } from "@/shared/lib/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";

const EMPTY_DONE: DoneMap = {};

export function DayHeader({ onAdd }: { onAdd: () => void }) {
  const lang = useAppStore((s) => s.settings.lang);
  const date = useAppStore((s) => s.selectedDate);
  const day = useAppStore((s) => s.schedule[s.selectedJd]);
  const times = useAppStore((s) => s.prayerTimes);
  const track = useAppStore((s) => s.settings.trackPrayers);
  const done = useAppStore((s) => s.history[s.selectedDate]?.done);
  const show = useAppStore((s) => s.settings.showTracking);

  const tasks = withPrayerTasks(day?.tasks ?? [], times, track);
  const prog = dayProgress(tasks, done ?? EMPTY_DONE);
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {loc(lang, day?.nameAr ?? "", day?.name ?? "")}
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted" dir="ltr">
            {date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {day?.gym ? (
            <Badge tone="danger">{day.gym === "upper" ? t(lang, "upper") : t(lang, "lower")}</Badge>
          ) : (
            <Badge>{t(lang, "restDay")}</Badge>
          )}
          <Button size="sm" variant="secondary" onClick={onAdd}>
            <Plus className="size-3.5" />
            {t(lang, "addTask")}
          </Button>
        </div>
      </div>
      {show ? (
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-xs text-fg-muted">
            <span>
              {prog.done}/{prog.total} {t(lang, "tasks")}
            </span>
            <span className="tabular-nums">
              {prog.pts} {t(lang, "ptsToday")}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      ) : null}
    </div>
  );
}
