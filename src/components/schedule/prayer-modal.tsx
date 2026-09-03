import { useState } from "react";
import { t, type Lang } from "@/lib/schedule/i18n";
import type { Task } from "@/lib/schedule/types";
import { Btn, Modal } from "./modal";
import { cn } from "@/shared/lib/cn";

const PLACES: { id: string; key: "mosque" | "home" | "workPlace" | "other" }[] = [
  { id: "mosque", key: "mosque" },
  { id: "home", key: "home" },
  { id: "work", key: "workPlace" },
  { id: "other", key: "other" },
];

export function PrayerModal({
  open,
  lang,
  task,
  onClose,
  onSave,
}: {
  open: boolean;
  lang: Lang;
  task: Task | null;
  onClose: () => void;
  onSave: (place: string, onTime: boolean) => void;
}) {
  const [place, setPlace] = useState("mosque");
  const [onTime, setOnTime] = useState(true);
  if (!task) return null;
  return (
    <Modal open={open} onClose={onClose} title={t(lang, "prayerTitle")} sub={lang === "ar" ? task.nameAr : task.name}>
      <div className="grid grid-cols-2 gap-2">
        {PLACES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlace(p.id)}
            className={cn(
              "h-11 rounded-sm border text-sm font-medium",
              place === p.id ? "border-accent bg-surface-2" : "border-border text-fg-muted",
            )}
          >
            {t(lang, p.key)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOnTime(true)}
          className={cn(
            "h-11 rounded-sm border text-sm font-medium",
            onTime ? "border-success bg-success/10 text-success" : "border-border text-fg-muted",
          )}
        >
          {t(lang, "onTime")}
        </button>
        <button
          type="button"
          onClick={() => setOnTime(false)}
          className={cn(
            "h-11 rounded-sm border text-sm font-medium",
            !onTime ? "border-warn bg-warn/10 text-warn" : "border-border text-fg-muted",
          )}
        >
          {t(lang, "qada")}
        </button>
      </div>
      <div className="mt-4 flex gap-2">
        <Btn className="flex-1" onClick={() => onSave(place, onTime)}>
          {t(lang, "save")}
        </Btn>
        <Btn variant="ghost" onClick={onClose}>
          {t(lang, "cancel")}
        </Btn>
      </div>
    </Modal>
  );
}
