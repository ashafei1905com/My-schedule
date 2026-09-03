import { Flame, Star, Trophy } from "lucide-react";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { t } from "@/shared/lib/i18n";

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Flame;
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <Icon className="size-3 text-fg-subtle sm:size-3.5" strokeWidth={1.75} />
        <span className="text-sm font-semibold tabular-nums tracking-tight text-fg sm:text-xl">{value}</span>
      </div>
      <span className="hidden text-xs font-medium tracking-wide text-fg-subtle uppercase sm:block">{label}</span>
    </div>
  );
}

export function StatsBar() {
  const lang = useAppStore((s) => s.settings.lang);
  const stats = useAppStore((s) => s.stats);
  const show = useAppStore((s) => s.settings.showTracking);
  if (!show) return null;
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-6">
      <Stat icon={Star} value={stats.pts} label={t(lang, "points")} />
      <Stat icon={Flame} value={stats.cur} label={t(lang, "streak")} />
      <Stat icon={Trophy} value={stats.best} label={t(lang, "best")} />
    </div>
  );
}
