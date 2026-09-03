import { lastNDays } from "@/features/history/services/history-service";
import { useAppStore, buildReportNow } from "@/features/persistence/controllers/use-app-store";
import { dayName, t } from "@/shared/lib/i18n";
import { Progress } from "@/shared/ui/progress";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent } from "@/shared/ui/sheet";

export function HistorySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const lang = useAppStore((s) => s.settings.lang);
  const history = useAppStore((s) => s.history);
  const week = useAppStore((s) => s.schedule);
  const today = useAppStore((s) => s.selectedDate);
  const days = lastNDays(history, week, today, 14);
  const report = buildReportNow();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t(lang, "history")} side="bottom">
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <h3 className="text-sm font-semibold">{t(lang, "weekReport")}</h3>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-semibold tabular-nums">{report.totalPts}</div>
              <div className="text-[11px] text-fg-subtle">{t(lang, "points")}</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums">{report.daysCompleted}</div>
              <div className="text-[11px] text-fg-subtle">{t(lang, "daysCompleted")}</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums">{report.tasksMissed}</div>
              <div className="text-[11px] text-fg-subtle">{t(lang, "missed")}</div>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        {days.every((d) => d.total === 0) ? (
          <div className="py-8 text-center">
            <p className="font-medium">{t(lang, "noHistory")}</p>
            <p className="mt-1 text-sm text-fg-muted">{t(lang, "noHistoryHint")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {days.map((d) => (
              <li key={d.date} className="rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {dayName(lang, d.jd)} · {d.date}
                  </span>
                  <span className="tabular-nums text-fg-muted">
                    {d.done}/{d.total}
                  </span>
                </div>
                <Progress value={d.total ? (d.done / d.total) * 100 : 0} />
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
