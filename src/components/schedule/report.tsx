import { t, CAT_LABEL, DAY_SHORT, type Lang } from "@/lib/schedule/i18n";
import { requiredTask } from "@/lib/schedule/store";
import type { DayLog, WeekSchedule } from "@/lib/schedule/types";
import { addDaysISO, jdFromISO, todayISO, weekStartSaturday } from "@/shared/lib/kuwait-time";
import { Modal } from "./modal";

export function WeeklyReport({
  open,
  lang,
  iso,
  history,
  schedule,
  onClose,
}: {
  open: boolean;
  lang: Lang;
  iso: string;
  history: Record<string, DayLog>;
  schedule: WeekSchedule;
  onClose: () => void;
}) {
  const start = weekStartSaturday(iso);
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  let pts = 0;
  let done = 0;
  let total = 0;
  const byCat: Record<string, { done: number; total: number; pts: number }> = {};

  for (const d of days) {
    const jd = jdFromISO(d);
    const tasks = (schedule[jd]?.tasks ?? []).filter(requiredTask);
    const log = history[d];
    total += tasks.length;
    for (const task of tasks) {
      const cat = task.category;
      byCat[cat] ??= { done: 0, total: 0, pts: 0 };
      byCat[cat].total += 1;
      const entry = log?.done[task.id];
      if (entry) {
        done += 1;
        pts += entry.pts;
        byCat[cat].done += 1;
        byCat[cat].pts += entry.pts;
      }
    }
  }

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title={t(lang, "weekReport")} sub={`${start} → ${days[6]}`} wide>
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label={t(lang, "completion")} value={`${pct}%`} />
        <Stat label={t(lang, "points")} value={String(pts)} />
        <Stat label={t(lang, "required")} value={`${done}/${total}`} />
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(byCat).map(([cat, v]) => (
          <div key={cat} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2">
            <div className="w-24 text-xs font-medium text-fg-muted">{CAT_LABEL[cat]?.[lang] ?? cat}</div>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-accent" style={{ width: `${v.total ? (v.done / v.total) * 100 : 0}%` }} />
            </div>
            <div className="w-16 text-end text-xs tabular-nums text-fg-muted">
              {v.done}/{v.total}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function HistorySheet({
  open,
  lang,
  history,
  schedule,
  onClose,
  onOpenDay,
}: {
  open: boolean;
  lang: Lang;
  history: Record<string, DayLog>;
  schedule: WeekSchedule;
  onClose: () => void;
  onOpenDay: (iso: string) => void;
}) {
  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(today, -i));
  return (
    <Modal open={open} onClose={onClose} title={t(lang, "history")} wide>
      <div className="flex flex-col gap-1.5">
        {days.map((iso) => {
          const jd = jdFromISO(iso);
          const tasks = (schedule[jd]?.tasks ?? []).filter(requiredTask);
          const log = history[iso];
          const done = tasks.filter((x) => log?.done[x.id]).length;
          const pts = Object.values(log?.done ?? {}).reduce((s, d) => s + d.pts, 0);
          const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onOpenDay(iso)}
              className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-3 text-start hover:border-border-strong"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {DAY_SHORT[lang][jd]}
                  <span className="ms-2 text-xs font-normal text-fg-muted">{iso}</span>
                  {iso === today ? (
                    <span className="ms-2 text-xs text-accent">{t(lang, "today")}</span>
                  ) : null}
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="text-end text-xs tabular-nums text-fg-muted">
                {done}/{tasks.length || 0}
                <div className="text-fg-subtle">{pts} pts</div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-3">
      <div className="font-display text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-fg-muted">{label}</div>
    </div>
  );
}
