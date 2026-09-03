import { History, MessageSquare, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { Link } from "@tanstack/react-router";
import { AssistantPanel } from "@/features/assistant/components/assistant-panel";
import { HistorySheet } from "@/features/history/components/history-sheet";
import { FoodLogDialog } from "@/features/nutrition/components/food-log-dialog";
import { MacroPanel } from "@/features/nutrition/components/macro-panel";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { StatsBar } from "@/features/points/components/stats-bar";
import { getRankMeta } from "@/features/points/services/rank-service";
import { PrayerLogDialog } from "@/features/prayers/components/prayer-log-dialog";
import { PrayerPills } from "@/features/prayers/components/prayer-pills";
import { DayHeader } from "@/features/schedule/components/day-header";
import { DayTabs } from "@/features/schedule/components/day-tabs";
import { TaskEditor } from "@/features/schedule/components/task-editor";
import { Timeline } from "@/features/schedule/components/timeline";
import type { Task } from "@/features/schedule/models/task";
import { SettingsScreen } from "@/features/settings/components/settings-screen";
import { applyDocumentTheme } from "@/features/settings/services/theme-service";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";

export function AppShell() {
  const { user, isPending } = useCurrentUserState();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const lang = useAppStore((s) => s.settings.lang);
  const settings = useAppStore((s) => s.settings);
  const stats = useAppStore((s) => s.stats);
  const onboarded = settings.onboardingComplete;
  const workspace = settings.workspaceName;
  const displayName = settings.displayName;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [foodTask, setFoodTask] = useState<Task | null>(null);
  const [prayerTask, setPrayerTask] = useState<Task | null>(null);

  useEffect(() => {
    if (isPending) return;
    void hydrate(Boolean(user));
  }, [hydrate, isPending, user?.id]);

  useEffect(() => {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    applyDocumentTheme(settings, stats.activeMythicTheme);
  }, [
    settings.themeAccent,
    settings.themeCard,
    settings.themeBg,
    settings.themePresetId,
    stats.activeMythicTheme,
  ]);

  if (!hydrated || isPending) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <p className="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">Smart Schedule</p>
        <h1 className="text-xl font-semibold tracking-tight text-fg">الجدول الذكي</h1>
        <p className="text-sm text-fg-muted">Protect focus. Keep the rest honest.</p>
        <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>
      </div>
    );
  }

  const rank = getRankMeta(stats.lifetime_xp || 0);
  const rankName = lang === "en" ? rank.title : rank.titleAr;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <Toaster theme="dark" position="bottom-center" richColors />
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
              {settings.appIcon} {t(lang, "appName")}
            </p>
            <p className="truncate text-sm font-semibold">
              {workspace || displayName || t(lang, "today")}
            </p>
          </div>
          <div className="hidden sm:flex">
            <StatsBar />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="hidden flex-col items-end pe-1 leading-tight sm:flex">
              <span className="text-[0.62rem] font-semibold text-fg-subtle">
                {lang === "en" ? "Your Rank:" : "رتبتك الحالية:"}
              </span>
              <span className="text-[0.78rem] font-extrabold text-accent">
                {rank.icon} {rankName}
              </span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setHistoryOpen(true)} aria-label={t(lang, "history")}>
              <History className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} aria-label={t(lang, "settings")}>
              <Settings className="size-4" />
            </Button>
            <SignedOut>
              <Button size="sm" variant="secondary" asChild className="hidden sm:inline-flex">
                <Link to="/login">{t(lang, "signIn")}</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <span className="hidden max-w-24 truncate text-xs text-fg-muted sm:inline">
                {user?.displayName?.split(" ")[0]}
              </span>
            </SignedIn>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3 sm:hidden">
          <StatsBar />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 pb-28">
        <DayTabs />
        <DayHeader
          onAdd={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        />
        <PrayerPills />
        <MacroPanel />
        <Timeline
          onEdit={(task) => {
            setEditing(task);
            setEditorOpen(true);
          }}
          onLogFood={(task) => setFoodTask(task)}
          onLogPrayer={(task) => setPrayerTask(task)}
        />
      </main>

      <button
        type="button"
        onClick={() => setAiOpen(true)}
        className="fixed end-4 bottom-5 z-20 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg shadow-panel"
      >
        <MessageSquare className="size-4" />
        {t(lang, "assistant")}
      </button>

      <TaskEditor open={editorOpen} onOpenChange={setEditorOpen} task={editing} />
      <FoodLogDialog open={Boolean(foodTask)} onOpenChange={(v) => !v && setFoodTask(null)} task={foodTask} />
      <PrayerLogDialog open={Boolean(prayerTask)} onOpenChange={(v) => !v && setPrayerTask(null)} task={prayerTask} />
      <SettingsScreen
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onAddTask={() => {
          setEditing(null);
          setEditorOpen(true);
        }}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} />
      <AssistantPanel open={aiOpen} onOpenChange={setAiOpen} />
      {!onboarded ? <OnboardingFlow /> : null}
    </div>
  );
}
