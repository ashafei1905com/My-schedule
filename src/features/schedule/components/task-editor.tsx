import { useEffect, useState } from "react";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { TASK_CATEGORIES, type Task, type TaskCategory } from "@/features/schedule/models/task";
import { newTaskId } from "@/features/schedule/services/schedule-service";
import { catName, dayName, t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";

export function TaskEditor({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
}) {
  const lang = useAppStore((s) => s.settings.lang);
  const jd = useAppStore((s) => s.selectedJd);
  const saveTask = useAppStore((s) => s.saveTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [name, setName] = useState("");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [category, setCategory] = useState<TaskCategory>("prog");
  const [desc, setDesc] = useState("");
  const [pts, setPts] = useState(10);
  const [optional, setOptional] = useState(false);
  const [foodLog, setFoodLog] = useState(false);
  const [days, setDays] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(task ? (lang === "ar" ? task.nameAr : task.name) : "");
    setStart(task?.start ?? "08:00");
    setEnd(task?.end ?? "09:00");
    setCategory(task?.category ?? "prog");
    setDesc(task ? (lang === "ar" ? task.descAr : task.desc) : "");
    setPts(task?.pts ?? 10);
    setOptional(Boolean(task?.optional));
    setFoodLog(Boolean(task?.foodLog));
    setDays([jd]);
  }, [open, task, jd, lang]);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function save() {
    const next: Task = {
      id: task?.id ?? newTaskId(),
      start,
      end,
      category,
      name: lang === "en" ? name : task?.name || name,
      nameAr: lang === "ar" ? name : task?.nameAr || name,
      desc: lang === "en" ? desc : task?.desc || desc,
      descAr: lang === "ar" ? desc : task?.descAr || desc,
      pts: Number(pts) || 0,
      notify: true,
      optional,
      foodLog: foodLog || category === "food" || category === "snack",
      mealKey: task?.mealKey,
      targetMacros: task?.targetMacros,
    };
    saveTask(jd, next, days);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={task ? t(lang, "editTask") : t(lang, "addTask")}>
        <div className="flex flex-col gap-3">
          <div>
            <Label>{t(lang, "name")}</Label>
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t(lang, "startTime")}</Label>
              <Input className="mt-1" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>{t(lang, "endTime")}</Label>
              <Input className="mt-1" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t(lang, "category")}</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {catName(lang, c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t(lang, "description")}</Label>
            <Textarea className="mt-1" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <Label>{t(lang, "pts")}</Label>
            <Input className="mt-1" type="number" value={pts} onChange={(e) => setPts(Number(e.target.value))} />
          </div>
          <div>
            <Label>{t(lang, "days")}</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[6, 0, 1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-md border px-2 py-1 text-xs ${days.includes(d) ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted"}`}
                >
                  {dayName(lang, d, true)}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t(lang, "optional")}</span>
            <Switch checked={optional} onCheckedChange={setOptional} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t(lang, "foodToggle")}</span>
            <Switch checked={foodLog} onCheckedChange={setFoodLog} />
          </label>
          <div className="mt-2 flex gap-2">
            <Button className="flex-1" onClick={save} disabled={!name.trim()}>
              {t(lang, "save")}
            </Button>
            {task ? (
              <Button
                variant="danger"
                onClick={() => {
                  deleteTask(jd, task.id);
                  onOpenChange(false);
                }}
              >
                {t(lang, "deleteTask")}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
