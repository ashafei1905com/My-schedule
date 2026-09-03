import { useState } from "react";
import { toast } from "sonner";
import type { FoodLogEntry } from "@/features/nutrition/models/food-log";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import type { Task } from "@/features/schedule/models/task";
import { loc, t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";

export function FoodLogDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
}) {
  const lang = useAppStore((s) => s.settings.lang);
  const logPlannedFood = useAppStore((s) => s.logPlannedFood);
  const logFood = useAppStore((s) => s.logFood);
  const estimateFood = useAppStore((s) => s.estimateFood);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!task) return null;
  const planned = task.targetMacros;

  async function saveCustom() {
    if (!task) return;
    setBusy(true);
    const res = await estimateFood(text);
    setBusy(false);
    if (!res.ok || !res.entry) {
      toast.error(t(lang, "noMatch"));
      return;
    }
    const entry: FoodLogEntry = {
      mealKey: task.mealKey ?? task.id,
      taskId: task.id,
      items: res.entry.items,
      macro: res.entry.macro,
      source: "logged",
      at: new Date().toISOString(),
      estimated: res.entry.estimated,
    };
    logFood(task, entry);
    toast.success(t(lang, "toastFood"));
    setText("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t(lang, "foodTitle")}>
        <p className="mb-3 text-sm text-fg-muted">{t(lang, "foodSub")}</p>
        {planned ? (
          <button
            type="button"
            className="mb-3 w-full rounded-lg border border-border bg-bg-elevated p-3 text-start hover:border-border-strong"
            onClick={() => {
              logPlannedFood(task);
              toast.success(t(lang, "toastFood"));
              onOpenChange(false);
            }}
          >
            <div className="text-sm font-medium">{t(lang, "applyPlanned")}</div>
            <div className="mt-1 text-xs text-fg-muted" dir="ltr">
              {planned.k} kcal · P {planned.p} · C {planned.c} · F {planned.f}
            </div>
            <div className="mt-1 text-xs text-fg-subtle">{loc(lang, task.descAr, task.desc)}</div>
          </button>
        ) : null}
        <Textarea
          placeholder={t(lang, "foodPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button className="mt-3 w-full" disabled={!text.trim() || busy} onClick={() => void saveCustom()}>
          {busy ? t(lang, "estimating") : t(lang, "compute")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
