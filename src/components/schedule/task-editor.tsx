import { useEffect, useState } from "react";
import { CATEGORIES, type Category, type Task } from "@/lib/schedule/types";
import { CAT_LABEL, DAY_SHORT, t, type Lang } from "@/lib/schedule/i18n";
import { WEEK_ORDER } from "@/shared/lib/kuwait-time";
import { Btn, Field, Modal, inputClass } from "./modal";
import { CatIcon } from "./icons";
import { cn } from "@/shared/lib/cn";

const PTS: { v: number; key: "low" | "mid" | "high" }[] = [
  { v: 5, key: "low" },
  { v: 15, key: "mid" },
  { v: 30, key: "high" },
];

export function TaskEditor({
  open,
  lang,
  jd,
  existing,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  lang: Lang;
  jd: number;
  existing: Task | null;
  onClose: () => void;
  onSave: (task: Task, days: number[]) => void;
  onDelete?: (id: string, days: number[]) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [cat, setCat] = useState<Category>("prog");
  const [pts, setPts] = useState(15);
  const [days, setDays] = useState<number[]>([jd]);
  const [notify, setNotify] = useState(true);
  const [food, setFood] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setName(lang === "ar" ? existing.nameAr : existing.name);
      setDesc(lang === "ar" ? existing.descAr : existing.desc);
      setStart(existing.start);
      setEnd(existing.end ?? existing.start);
      setCat(existing.category);
      setPts(existing.pts);
      setDays([jd]);
      setNotify(existing.notify);
      setFood(Boolean(existing.foodLog));
    } else {
      setName("");
      setDesc("");
      setStart("09:00");
      setEnd("10:30");
      setCat("prog");
      setPts(15);
      setDays([jd]);
      setNotify(true);
      setFood(false);
    }
  }, [open, existing, jd, lang]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const save = () => {
    const label = name.trim() || (lang === "ar" ? "مهمة" : "Task");
    const task: Task = {
      id: existing?.id ?? `${jd}-${Date.now().toString(36)}`,
      start,
      end,
      category: cat,
      name: label,
      nameAr: label,
      desc: desc.trim(),
      descAr: desc.trim(),
      pts,
      notify,
      foodLog: food || cat === "food" || cat === "snack",
      optional: cat === "snack" || cat === "free" || pts <= 5,
      mealKey: food || cat === "food" || cat === "snack" ? `custom:${label}` : undefined,
    };
    onSave(task, days.length ? days : [jd]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? t(lang, "editTask") : t(lang, "addTask")}>
      <div className="flex flex-col gap-3">
        <Field label={t(lang, "taskName")}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t(lang, "startTime")}>
            <input type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label={t(lang, "endTime")}>
            <input type="time" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <Field label={t(lang, "description")}>
          <input className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Field label={t(lang, "days")}>
          <div className="flex flex-wrap gap-1.5">
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "h-9 min-w-11 rounded-sm border px-2 text-xs font-medium",
                  days.includes(d) ? "border-accent bg-surface-2 text-fg" : "border-border text-fg-muted",
                )}
              >
                {DAY_SHORT[lang][d]}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t(lang, "category")}>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-sm border px-2 text-xs",
                  cat === c ? "border-accent bg-surface-2 text-fg" : "border-border text-fg-muted",
                )}
              >
                <CatIcon category={c} className="size-3.5" />
                {CAT_LABEL[c][lang]}
              </button>
            ))}
          </div>
        </Field>
        <Field label={t(lang, "intensity")}>
          <div className="grid grid-cols-3 gap-1.5">
            {PTS.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPts(p.v)}
                className={cn(
                  "h-10 rounded-sm border text-xs font-medium",
                  pts === p.v ? "border-accent bg-surface-2 text-fg" : "border-border text-fg-muted",
                )}
              >
                {t(lang, p.key)} · {p.v}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center justify-between gap-3 py-1 text-sm">
          <span>{t(lang, "notify")}</span>
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="size-4 accent-accent" />
        </label>
        <label className="flex items-center justify-between gap-3 py-1 text-sm">
          <span>{t(lang, "foodToggle")}</span>
          <input type="checkbox" checked={food} onChange={(e) => setFood(e.target.checked)} className="size-4 accent-accent" />
        </label>
        <div className="mt-2 flex gap-2">
          <Btn className="flex-1" onClick={save}>
            {t(lang, "save")}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>
            {t(lang, "cancel")}
          </Btn>
        </div>
        {existing && onDelete ? (
          <Btn
            variant="danger"
            onClick={() => {
              onDelete(existing.id, days.length ? days : [jd]);
              onClose();
            }}
          >
            {t(lang, "delete")}
          </Btn>
        ) : null}
      </div>
    </Modal>
  );
}
