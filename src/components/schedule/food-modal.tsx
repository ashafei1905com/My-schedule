import { useMemo, useState } from "react";
import { estimateFood } from "@/lib/ai";
import { t, type Lang } from "@/lib/schedule/i18n";
import { lookupFood } from "@/lib/schedule/store";
import type { Macros, SavedMeal, Task } from "@/lib/schedule/types";
import { Btn, Modal, inputClass } from "./modal";

export function FoodModal({
  open,
  lang,
  task,
  saved,
  onClose,
  onSave,
}: {
  open: boolean;
  lang: Lang;
  task: Task | null;
  saved: SavedMeal[];
  onClose: () => void;
  onSave: (text: string, macro: Macros, estimated: boolean, keep: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ macro: Macros; estimated: boolean; name: string } | null>(null);
  const [err, setErr] = useState("");

  const options = useMemo(
    () => (task?.mealKey ? saved.filter((m) => m.mealKey === task.mealKey) : saved.slice(0, 6)),
    [saved, task],
  );

  const reset = () => {
    setText("");
    setResult(null);
    setErr("");
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const compute = async (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setBusy(true);
    setErr("");
    const local = lookupFood(q);
    if (local.matched && local.macro.k > 0) {
      setResult({ macro: local.macro, estimated: false, name: q });
      setBusy(false);
      return;
    }
    try {
      const res = await estimateFood({ data: { description: q } });
      if (res.ok) {
        setResult({ macro: res.macro, estimated: true, name: res.name });
      } else {
        setResult({
          macro: { p: 22, c: 38, f: 14, b: 4, k: 370 },
          estimated: true,
          name: q,
        });
      }
    } catch {
      setResult({
        macro: { p: 22, c: 38, f: 14, b: 4, k: 370 },
        estimated: true,
        name: q,
      });
    } finally {
      setBusy(false);
    }
  };

  if (!task) return null;

  return (
    <Modal open={open} onClose={close} title={t(lang, "foodTitle")} sub={lang === "ar" ? task.nameAr : task.name}>
      {!result ? (
        <div className="flex flex-col gap-3">
          {options.length ? (
            <div className="flex flex-col gap-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSave(o.label, o.macro, false, false)}
                  className="rounded-md border border-border bg-surface px-3 py-3 text-start text-sm hover:border-accent"
                >
                  <div className="font-medium">{o.label}</div>
                  <div className="mt-0.5 text-xs text-fg-muted">
                    {Math.round(o.macro.k)} {t(lang, "kcal")} · P{o.macro.p} C{o.macro.c} F{o.macro.f}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            className={inputClass + " h-24 py-2"}
            placeholder={t(lang, "foodPh")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <Btn disabled={busy || !text.trim()} onClick={() => void compute(text)}>
            {busy ? t(lang, "estimating") : t(lang, "compute")}
          </Btn>
          <Btn variant="ghost" onClick={close}>
            {t(lang, "cancel")}
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <MacroGrid lang={lang} macro={result.macro} estimated={result.estimated} />
          <Btn onClick={() => onSave(text || result.name, result.macro, result.estimated, true)}>
            {t(lang, "saveMeal")}
          </Btn>
          <Btn variant="ghost" onClick={() => onSave(text || result.name, result.macro, result.estimated, false)}>
            {t(lang, "done")}
          </Btn>
        </div>
      )}
    </Modal>
  );
}

export function MacroGrid({
  lang,
  macro,
  estimated,
}: {
  lang: Lang;
  macro: Macros;
  estimated?: boolean;
}) {
  const cells = [
    [t(lang, "kcal"), Math.round(macro.k)],
    [t(lang, "protein"), `${macro.p}g`],
    [t(lang, "carbs"), `${macro.c}g`],
    [t(lang, "fat"), `${macro.f}g`],
    [t(lang, "fiber"), `${macro.b}g`],
  ];
  return (
    <div>
      {estimated ? <p className="mb-2 text-xs text-fg-subtle">{t(lang, "approx")}</p> : null}
      <div className="grid grid-cols-5 gap-2">
        {cells.map(([k, v]) => (
          <div key={k} className="rounded-sm bg-surface px-2 py-2 text-center">
            <div className="font-display text-sm font-semibold tabular-nums">{v}</div>
            <div className="text-xs text-fg-muted">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
