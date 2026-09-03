import { useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { TaskCard } from "@/features/schedule/components/task-card";
import type { DoneMap, Task } from "@/features/schedule/models/task";
import { currentTaskId, withPrayerTasks } from "@/features/schedule/services/schedule-service";
import { t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";

const EMPTY_DONE: DoneMap = {};

export function Timeline({
  onEdit,
  onLogFood,
  onLogPrayer,
}: {
  onEdit: (task: Task) => void;
  onLogFood: (task: Task) => void;
  onLogPrayer: (task: Task) => void;
}) {
  const lang = useAppStore((s) => s.settings.lang);
  const jd = useAppStore((s) => s.selectedJd);
  const day = useAppStore((s) => s.schedule[s.selectedJd]);
  const times = useAppStore((s) => s.prayerTimes);
  const track = useAppStore((s) => s.settings.trackPrayers);
  const done = useAppStore((s) => s.history[s.selectedDate]?.done);
  const complete = useAppStore((s) => s.complete);
  const uncomplete = useAppStore((s) => s.uncomplete);
  const applyTemplate = useAppStore((s) => s.applyTemplate);

  const tasks = withPrayerTasks(day?.tasks ?? [], times, track);
  const currentId = currentTaskId(tasks);
  const doneMap = done ?? EMPTY_DONE;

  useEffect(() => {
    if (!currentId) return;
    const el = document.querySelector(`[data-task-id="${currentId}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentId, jd]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center">
        <p className="font-medium">{t(lang, "emptyDay")}</p>
        <p className="mt-1 text-sm text-fg-muted">{t(lang, "emptyDayHint")}</p>
        <Button className="mt-4" variant="secondary" onClick={applyTemplate}>
          {t(lang, "useTemplate")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2 ps-3">
      <div className="absolute top-2 bottom-2 start-0 w-px bg-border" />
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          done={doneMap[task.id]}
          lang={lang}
          onComplete={() => {
            const r = complete(task);
            toast.success(r.status === "late" ? t(lang, "toastLate") : t(lang, "toastDone"));
          }}
          onUndo={() => uncomplete(task.id)}
          onEdit={() => onEdit(task)}
          onLogFood={() => onLogFood(task)}
          onLogPrayer={() => onLogPrayer(task)}
        />
      ))}
    </div>
  );
}
