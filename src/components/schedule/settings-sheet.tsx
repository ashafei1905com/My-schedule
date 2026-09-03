import { t, type Lang } from "@/lib/schedule/i18n";
import type { Settings } from "@/lib/schedule/types";
import { Btn, Field, Modal, inputClass } from "./modal";

export function SettingsSheet({
  open,
  lang,
  settings,
  onClose,
  onPatch,
  onLang,
  onReset,
  onReplay,
  onAddTask,
}: {
  open: boolean;
  lang: Lang;
  settings: Settings;
  onClose: () => void;
  onPatch: (p: Partial<Settings>) => void;
  onLang: (l: Lang) => void;
  onReset: () => void;
  onReplay: () => void;
  onAddTask: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={t(lang, "settings")} wide>
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "general")}</h3>
          <div className="flex flex-col gap-3">
            <Field label={t(lang, "yourName")}>
              <input className={inputClass} value={settings.name} onChange={(e) => onPatch({ name: e.target.value })} />
            </Field>
            <Btn variant="quiet" onClick={onAddTask}>
              {t(lang, "addTask")}
            </Btn>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "tracking")}</h3>
          <Toggle
            label={t(lang, "showTracking")}
            checked={settings.showTracking}
            onChange={(v) => onPatch({ showTracking: v })}
          />
          <Toggle
            label={t(lang, "trackPrayers")}
            checked={settings.trackPrayers}
            onChange={(v) => onPatch({ trackPrayers: v })}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label={t(lang, "city")}>
              <input className={inputClass} value={settings.city} onChange={(e) => onPatch({ city: e.target.value })} />
            </Field>
            <Field label={t(lang, "country")}>
              <input className={inputClass} value={settings.country} onChange={(e) => onPatch({ country: e.target.value })} />
            </Field>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "macros")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Num label={t(lang, "kcal")} value={settings.kcalTarget} onChange={(v) => onPatch({ kcalTarget: v })} />
            <Num label={t(lang, "protein")} value={settings.proteinTarget} onChange={(v) => onPatch({ proteinTarget: v })} />
            <Num label={t(lang, "carbs")} value={settings.carbsTarget} onChange={(v) => onPatch({ carbsTarget: v })} />
            <Num label={t(lang, "fat")} value={settings.fatTarget} onChange={(v) => onPatch({ fatTarget: v })} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "language")}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant={lang === "en" ? "primary" : "ghost"} onClick={() => onLang("en")}>
              English
            </Btn>
            <Btn variant={lang === "ar" ? "primary" : "ghost"} onClick={() => onLang("ar")}>
              العربية
            </Btn>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <Btn variant="ghost" onClick={onReplay}>
            {t(lang, "replaySetup")}
          </Btn>
          <Btn variant="danger" onClick={onReset}>
            {t(lang, "reset")}
          </Btn>
        </section>
      </div>
    </Modal>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" className="size-4 accent-accent" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </Field>
  );
}
