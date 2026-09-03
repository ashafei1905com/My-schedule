import { useState } from "react";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import type { PrayerPlace } from "@/features/prayers/models/prayer";
import type { Task } from "@/features/schedule/models/task";
import { loc, t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

const PLACES: PrayerPlace[] = ["mosque", "home", "work", "other"];

export function PrayerLogDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
}) {
  const lang = useAppStore((s) => s.settings.lang);
  const logPrayer = useAppStore((s) => s.logPrayer);
  const [place, setPlace] = useState<PrayerPlace>("mosque");
  const [onTime, setOnTime] = useState(true);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t(lang, "prayerTitle")}>
        <p className="mb-3 text-sm text-fg-muted">{loc(lang, task.nameAr, task.name)}</p>
        <div className="grid grid-cols-2 gap-2">
          {PLACES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlace(p)}
              className={`rounded-lg border px-3 py-2 text-sm ${place === p ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted"}`}
            >
              {t(lang, p === "work" ? "workPlace" : p)}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOnTime(true)}
            className={`rounded-lg border px-3 py-2 text-sm ${onTime ? "border-success bg-success/15 text-success" : "border-border text-fg-muted"}`}
          >
            {t(lang, "onTime")}
          </button>
          <button
            type="button"
            onClick={() => setOnTime(false)}
            className={`rounded-lg border px-3 py-2 text-sm ${!onTime ? "border-warn bg-warn/15 text-warn" : "border-border text-fg-muted"}`}
          >
            {t(lang, "qada")}
          </button>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            logPrayer(task.id, { place, onTime, at: new Date().toISOString() });
            onOpenChange(false);
          }}
        >
          {t(lang, "save")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
