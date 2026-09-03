import { CATEGORY_COLOR } from "@/features/schedule/models/category";
import type { DoneEntry, Task } from "@/features/schedule/models/task";
import { CategoryIcon } from "@/features/schedule/components/category-icon";
import { isCurrentTask } from "@/features/schedule/services/schedule-service";
import { cn } from "@/shared/lib/cn";
import { formatArabicTime, formatEnglishTime } from "@/shared/lib/kuwait-time";
import { catName, loc, t, type Lang } from "@/shared/lib/i18n";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export function TaskCard({
  task,
  done,
  lang,
  onComplete,
  onUndo,
  onEdit,
  onLogFood,
  onLogPrayer,
}: {
  task: Task;
  done?: DoneEntry;
  lang: Lang;
  onComplete: () => void;
  onUndo: () => void;
  onEdit: () => void;
  onLogFood: () => void;
  onLogPrayer: () => void;
}) {
  const current = !done && isCurrentTask(task);
  const time = lang === "ar" ? formatArabicTime(task.start) : formatEnglishTime(task.start);
  const end = task.end
    ? lang === "ar"
      ? formatArabicTime(task.end)
      : formatEnglishTime(task.end)
    : null;

  return (
    <article
      data-task-id={task.id}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 transition-shadow sm:flex-row sm:items-start",
        done && "border-success/30 bg-success/5",
        current && "ring-2 ring-accent/50 shadow-panel",
      )}
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: CATEGORY_COLOR[task.category] }}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <div className="w-14 shrink-0 pt-0.5 text-start text-[11px] font-medium text-fg-subtle tabular-nums" dir="ltr">
          <div>{time}</div>
          {end ? <div className="opacity-70">{end}</div> : null}
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-bg-elevated text-fg-muted">
          <CategoryIcon category={task.category} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-semibold text-fg">{loc(lang, task.nameAr, task.name)}</h3>
            {task.optional ? <Badge>{t(lang, "optional")}</Badge> : null}
            {current ? <Badge tone="accent">{t(lang, "current")}</Badge> : null}
            {done ? (
              <Badge tone={done.status === "ontime" ? "success" : done.status === "late" ? "warn" : "muted"}>
                {done.status === "ontime" ? t(lang, "done") : done.status === "late" ? t(lang, "late") : t(lang, "qada")}
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
            {loc(lang, task.descAr, task.desc) || catName(lang, task.category)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-fg-subtle tabular-nums">
              {task.pts} {t(lang, "pts")}
            </span>
            <button type="button" className="text-[11px] text-fg-subtle hover:text-fg" onClick={onEdit}>
              {t(lang, "editTask")}
            </button>
          </div>
        </div>
      </div>
      <div className="shrink-0 sm:self-start">
        {done ? (
          <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={onUndo}>
            {t(lang, "undo")}
          </Button>
        ) : task.foodLog ? (
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={onLogFood}>
            {t(lang, "logFood")}
          </Button>
        ) : task.category === "prayer" ? (
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={onLogPrayer}>
            {t(lang, "log")}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={onComplete}>
            {t(lang, "markDone")}
          </Button>
        )}
      </div>
    </article>
  );
}
