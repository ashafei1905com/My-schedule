import { useState } from "react";
import { t, type Lang } from "@/lib/schedule/i18n";
import { useSchedule } from "@/lib/schedule/store";
import { Btn, Field, inputClass } from "./modal";
import { cn } from "@/shared/lib/cn";

export function Onboarding() {
  const settings = useSchedule((s) => s.settings);
  const finish = useSchedule((s) => s.finishOnboarding);
  const setLang = useSchedule((s) => s.setLang);
  const lang = settings.lang;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [track, setTrack] = useState(true);
  const [peakStart, setPeakStart] = useState(settings.peakStart);
  const [peakEnd, setPeakEnd] = useState(settings.peakEnd);
  const [logoff, setLogoff] = useState(settings.logoff);
  const [mode, setMode] = useState<"template" | "blank">("template");

  const steps = 4;
  const next = () => {
    if (step < steps - 1) setStep(step + 1);
    else finish({ name: name.trim() || (lang === "ar" ? "صديق" : "Friend"), trackPrayers: track, peakStart, peakEnd, logoff, mode });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="font-display text-sm font-semibold tracking-tight">{t(lang, "app")}</div>
        <div className="flex gap-1 rounded-sm border border-border p-0.5">
          <LangChip active={lang === "en"} onClick={() => setLang("en")}>
            EN
          </LangChip>
          <LangChip active={lang === "ar"} onClick={() => setLang("ar")}>
            ع
          </LangChip>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8">
        <div className="mb-8 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${((step + 1) / steps) * 100}%` }}
          />
        </div>

        {step === 0 && (
          <section>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance">
              {t(lang, "onboardingTitle")}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{t(lang, "onboardingSub")}</p>
            <Field label={t(lang, "yourName")}>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(lang, "namePh")}
                autoFocus
              />
            </Field>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t(lang, "trackPrayersQ")}</h1>
            <div className="mt-6 grid gap-3">
              <Choice active={track} onClick={() => setTrack(true)} label={t(lang, "trackPrayersYes")} />
              <Choice active={!track} onClick={() => setTrack(false)} label={t(lang, "trackPrayersNo")} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t(lang, "peakQ")}</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Field label={t(lang, "startTime")}>
                <input type="time" className={inputClass} value={peakStart} onChange={(e) => setPeakStart(e.target.value)} />
              </Field>
              <Field label={t(lang, "endTime")}>
                <input type="time" className={inputClass} value={peakEnd} onChange={(e) => setPeakEnd(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label={t(lang, "logoffQ")}>
                <input type="time" className={inputClass} value={logoff} onChange={(e) => setLogoff(e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t(lang, "startMode")}</h1>
            <div className="mt-6 grid gap-3">
              <Choice active={mode === "template"} onClick={() => setMode("template")} label={t(lang, "modeTemplate")} />
              <Choice active={mode === "blank"} onClick={() => setMode("blank")} label={t(lang, "modeBlank")} />
            </div>
          </section>
        )}

        <div className="mt-auto flex gap-3 pt-10">
          {step > 0 ? (
            <Btn variant="ghost" className="flex-1" onClick={() => setStep(step - 1)}>
              {lang === "ar" ? "رجوع" : "Back"}
            </Btn>
          ) : null}
          <Btn className="flex-1" onClick={next}>
            {step === steps - 1 ? t(lang, "start") : lang === "ar" ? "التالي" : "Next"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function LangChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 rounded-[6px] px-2 text-xs font-medium",
        active ? "bg-primary text-primary-fg" : "text-fg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Choice({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-4 py-4 text-start text-sm font-medium transition-colors",
        active ? "border-accent bg-surface-2 text-fg" : "border-border bg-surface text-fg-muted",
      )}
    >
      {label}
    </button>
  );
}

export function langDir(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
