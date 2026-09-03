import { useState } from "react";
import { EMPTY_ONBOARDING, ONBOARDING_STEPS } from "@/features/onboarding/models/onboarding";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Progress } from "@/shared/ui/progress";

export function OnboardingFlow() {
  const lang = useAppStore((s) => s.settings.lang);
  const finish = useAppStore((s) => s.finishOnboarding);
  const patch = useAppStore((s) => s.patchSettings);
  const [step, setStep] = useState(0);
  const [a, setA] = useState(EMPTY_ONBOARDING);

  function next() {
    if (step < ONBOARDING_STEPS - 1) setStep(step + 1);
    else finish(a);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/80 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
              {t(lang, "appName")}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{t(lang, "onboardingTitle")}</h1>
          </div>
          <div className="flex gap-1">
            <button type="button" className="text-xs text-fg-muted" onClick={() => patch({ lang: lang === "ar" ? "en" : "ar" })}>
              {lang === "ar" ? "EN" : "ع"}
            </button>
          </div>
        </div>
        <p className="mb-4 text-sm text-fg-muted">{t(lang, "onboardingSub")}</p>
        <Progress value={((step + 1) / ONBOARDING_STEPS) * 100} className="mb-5" />

        {step === 0 ? (
          <div>
            <Label>{t(lang, "onboardingName")}</Label>
            <Input
              className="mt-2"
              placeholder={t(lang, "onboardingNamePh")}
              value={a.name}
              onChange={(e) => setA({ ...a, name: e.target.value })}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t(lang, "onboardingPrayers")}</p>
            <button
              type="button"
              onClick={() => setA({ ...a, trackPrayers: true })}
              className={`rounded-lg border p-3 text-start ${a.trackPrayers ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="text-sm font-medium">{t(lang, "onboardingPrayersYes")}</div>
              <div className="text-xs text-fg-muted">{t(lang, "onboardingPrayersYesDesc")}</div>
            </button>
            <button
              type="button"
              onClick={() => setA({ ...a, trackPrayers: false })}
              className={`rounded-lg border p-3 text-start ${!a.trackPrayers ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="text-sm font-medium">{t(lang, "onboardingPrayersNo")}</div>
              <div className="text-xs text-fg-muted">{t(lang, "onboardingPrayersNoDesc")}</div>
            </button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="mb-2 text-sm font-medium">{t(lang, "onboardingPeak")}</p>
            </div>
            <div>
              <Label>{t(lang, "peakStart")}</Label>
              <Input className="mt-1" type="time" value={a.peakStart} onChange={(e) => setA({ ...a, peakStart: e.target.value })} />
            </div>
            <div>
              <Label>{t(lang, "peakEnd")}</Label>
              <Input className="mt-1" type="time" value={a.peakEnd} onChange={(e) => setA({ ...a, peakEnd: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>{t(lang, "onboardingLogoff")}</Label>
              <Input className="mt-1" type="time" value={a.logoff} onChange={(e) => setA({ ...a, logoff: e.target.value })} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{t(lang, "onboardingMode")}</p>
            <button
              type="button"
              onClick={() => setA({ ...a, buildMode: "template" })}
              className={`rounded-lg border p-3 text-start ${a.buildMode === "template" ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="text-sm font-medium">{t(lang, "onboardingTemplate")}</div>
              <div className="text-xs text-fg-muted">{t(lang, "onboardingTemplateDesc")}</div>
            </button>
            <button
              type="button"
              onClick={() => setA({ ...a, buildMode: "custom" })}
              className={`rounded-lg border p-3 text-start ${a.buildMode === "custom" ? "border-primary bg-primary/10" : "border-border"}`}
            >
              <div className="text-sm font-medium">{t(lang, "onboardingCustom")}</div>
              <div className="text-xs text-fg-muted">{t(lang, "onboardingCustomDesc")}</div>
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div>
            <Label>{t(lang, "onboardingWs")}</Label>
            <Input
              className="mt-2"
              placeholder={t(lang, "onboardingWsPh")}
              value={a.workspaceName}
              onChange={(e) => setA({ ...a, workspaceName: e.target.value })}
            />
          </div>
        ) : null}

        <div className="mt-6 flex gap-2">
          {step > 0 ? (
            <Button variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>
              {t(lang, "back")}
            </Button>
          ) : null}
          <Button className="flex-1" onClick={next} disabled={step === 0 && !a.name.trim()}>
            {step === ONBOARDING_STEPS - 1 ? t(lang, "finish") : t(lang, "next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
