import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { dayMacros, pct } from "@/features/nutrition/services/nutrition-service";
import { t } from "@/shared/lib/i18n";
import { Progress } from "@/shared/ui/progress";

function Row({
  label,
  value,
  target,
  barClass,
}: {
  label: string;
  value: number;
  target: number;
  barClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[11px] font-medium text-fg-subtle">{label}</span>
      <Progress value={pct(value, target)} className="flex-1" barClassName={barClass} />
      <span className="w-16 shrink-0 text-end text-[11px] tabular-nums text-fg-muted" dir="ltr">
        {Math.round(value)}/{target}
      </span>
    </div>
  );
}

export function MacroPanel() {
  const lang = useAppStore((s) => s.settings.lang);
  const show = useAppStore((s) => s.settings.showTracking);
  const settings = useAppStore((s) => s.settings);
  const logs = useAppStore((s) => s.foodLogs[s.selectedDate]);
  if (!show) return null;
  const m = dayMacros(logs);
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-fg-muted">{t(lang, "nutrition")}</span>
        <span className="text-xs font-semibold tabular-nums text-fg">
          {Math.round(m.k)} / {settings.kcalTarget} {t(lang, "kcal")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Row label={t(lang, "protein")} value={m.p} target={settings.proteinTarget} barClass="bg-success" />
        <Row label={t(lang, "carbs")} value={m.c} target={settings.carbsTarget} barClass="bg-warn" />
        <Row label={t(lang, "fat")} value={m.f} target={settings.fatTarget} barClass="bg-cat-sleep" />
        <Row label={t(lang, "fiber")} value={m.b} target={settings.fiberTarget} barClass="bg-cat-swim" />
      </div>
    </div>
  );
}
