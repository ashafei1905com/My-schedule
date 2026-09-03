import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
  MessageSquare,
  Plus,
  Settings as SettingsIcon,
  Undo2,
} from "lucide-react";
import { CAT_LABEL, DAY_FULL, DAY_SHORT, t } from "@/lib/schedule/i18n";
import { fetchPrayerTimes } from "@/lib/schedule/prayers";
import { CATEGORY_META } from "@/lib/schedule/templates";
import {
  boardContext,
  dayMacros,
  dayStats,
  getVisibleTasks,
  requiredTask,
  useSchedule,
} from "@/lib/schedule/store";
import type { Task } from "@/lib/schedule/types";
import {
  WEEK_ORDER,
  addDaysISO,
  formatArabicTime,
  formatEnglishTime,
  kuwaitNowMinutes,
  minutesTo24h,
  todayISO,
  todayJD,
  toMinutes,
} from "@/shared/lib/kuwait-time";
import { cn } from "@/shared/lib/cn";
import { CatIcon } from "./icons";
import { AiPanel } from "./ai-panel";
import { FoodModal } from "./food-modal";
import { Onboarding, langDir } from "./onboarding";
import { PrayerModal } from "./prayer-modal";
import { HistorySheet, WeeklyReport } from "./report";
import { SettingsSheet } from "./settings-sheet";
import { TaskEditor } from "./task-editor";
import { Btn } from "./modal";

function useNow(ms = 20000) {
  const [now, setNow] = useState(() => ({ min: kuwaitNowMinutes(), iso: todayISO(), jd: todayJD() }));
  useEffect(() => {
    const tick = () => setNow({ min: kuwaitNowMinutes(), iso: todayISO(), jd: todayJD() });
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function AppShell() {
  const hydrated = useSchedule((s) => s.hydrated);
  const settings = useSchedule((s) => s.settings);
  const stats = useSchedule((s) => s.stats);
  const schedule = useSchedule((s) => s.schedule);
  const history = useSchedule((s) => s.history);
  const meals = useSchedule((s) => s.meals);
  const prayers = useSchedule((s) => s.prayers);
  const viewingISO = useSchedule((s) => s.viewingISO);
  const selectedJD = useSchedule((s) => s.selectedJD);
  const chat = useSchedule((s) => s.chat);
  const toast = useSchedule((s) => s.toast);
  const store = useSchedule;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [foodTask, setFoodTask] = useState<Task | null>(null);
  const [prayerTask, setPrayerTask] = useState<Task | null>(null);

  const lang = settings.lang;
  const now = useNow();
  const dir = langDir(lang);

  useEffect(() => {
    void useSchedule.persist.rehydrate();
    const t = window.setTimeout(() => {
      if (!useSchedule.getState().hydrated) useSchedule.getState().setHydrated(true);
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  useEffect(() => {
    if (!hydrated || !settings.trackPrayers) return;
    void fetchPrayerTimes(settings.city, settings.country)
      .then((p) => store.getState().setPrayers(p))
      .catch(() => {});
  }, [hydrated, settings.trackPrayers, settings.city, settings.country, store]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => store.getState().clearToast(), 2400);
    return () => clearTimeout(id);
  }, [toast, store]);

  const snapshot = useSchedule.getState();
  const tasks = useMemo(
    () => getVisibleTasks({ schedule, selectedJD, settings, prayers }),
    [schedule, selectedJD, settings, prayers],
  );
  const log = history[viewingISO];
  const progress = dayStats({ ...snapshot, schedule, selectedJD, settings, prayers, history, viewingISO });
  const macros = dayMacros(log);
  const isToday = viewingISO === now.iso;
  const currentId = isToday ? currentTaskId(tasks, now.min) : null;

  const scroller = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!currentId) return;
    const el = scroller.current?.querySelector(`[data-task="${CSS.escape(currentId)}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentId, hydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg text-fg">
        <div className="mb-5 size-10 rounded-md border border-border-strong" />
        <div className="font-display text-lg font-semibold tracking-tight">{t(lang, "app")}</div>
        <div className="mt-2 h-0.5 w-24 overflow-hidden rounded-full bg-border">
          <div className="h-full w-1/2 animate-pulse bg-accent" />
        </div>
      </div>
    );
  }

  if (!settings.onboarded) return <Onboarding />;

  const day = schedule[selectedJD];
  const fmt = (raw: string) => (lang === "ar" ? formatArabicTime(raw) : formatEnglishTime(raw));
  const clock = fmt(minutesTo24h(now.min));

  const shiftDay = (delta: number) => store.getState().setViewing(addDaysISO(viewingISO, delta));

  const handleComplete = (task: Task) => {
    if (task.foodLog) {
      setFoodTask(task);
      return;
    }
    if (task.category === "prayer") {
      setPrayerTask(task);
      return;
    }
    store.getState().completeTask(task);
    const end = task.end ? toMinutes(task.end) : toMinutes(task.start) + 40;
    const late = isToday && now.min > end + 10;
    store.getState().showToast(late ? t(lang, "toastLate") : t(lang, "toastDone"), late ? "late" : "ok");
  };

  return (
    <div className="min-h-dvh bg-bg text-fg" dir={dir}>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-semibold tracking-tight">{t(lang, "app")}</div>
            <div className="truncate text-xs text-fg-muted">
              {settings.name ? (lang === "ar" ? `أهلاً ${settings.name}` : `Hi, ${settings.name}`) : t(lang, "tagline")}
              <span className="mx-1.5 text-fg-subtle">·</span>
              <span className="tabular-nums">{clock}</span>
            </div>
          </div>
          {settings.showTracking ? (
            <div className="flex gap-3">
              <Stat n={stats.pts} label={t(lang, "points")} />
              <Stat n={stats.cur} label={t(lang, "streak")} />
              <Stat n={stats.best} label={t(lang, "best")} />
            </div>
          ) : null}
          <div className="flex items-center gap-0.5">
            <IconBtn label={t(lang, "history")} onClick={() => setHistoryOpen(true)}>
              <HistoryIcon className="size-4" />
            </IconBtn>
            <IconBtn label={t(lang, "report")} onClick={() => setReportOpen(true)}>
              <BarChart3 className="size-4" />
            </IconBtn>
            <IconBtn label={t(lang, "settings")} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="size-4" />
            </IconBtn>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
        <div className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-1.5">
            {WEEK_ORDER.map((jd) => {
              const active = jd === selectedJD;
              const today = jd === now.jd;
              return (
                <button
                  key={jd}
                  type="button"
                  onClick={() => store.getState().selectDay(jd)}
                  className={cn(
                    "flex min-w-14 flex-col items-center rounded-md border px-3 py-2 transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-fg"
                      : today
                        ? "border-accent/50 bg-surface text-fg"
                        : "border-border bg-surface text-fg-muted hover:border-border-strong",
                  )}
                >
                  <span className="text-xs font-medium uppercase tracking-wide">{DAY_SHORT[lang][jd]}</span>
                  {today ? <span className="mt-0.5 size-1 rounded-full bg-current opacity-70" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <section className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="flex size-10 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label={t(lang, "prevDay")}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <div className="min-w-0 text-center">
            <div className="font-display text-base font-semibold tracking-tight">
              {DAY_FULL[lang][selectedJD]}
              {isToday ? <span className="ms-2 text-xs font-medium text-accent">{t(lang, "today")}</span> : null}
            </div>
            <div className="mt-0.5 text-xs text-fg-muted">
              {viewingISO}
              <span className="mx-1.5">·</span>
              {day?.gym
                ? `${t(lang, "gymDay")} · ${t(lang, day.gym)}`
                : t(lang, "restDay")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="flex size-10 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label={t(lang, "nextDay")}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </section>

        {settings.showTracking ? (
          <>
            <div className="mb-3 rounded-md border border-border bg-surface px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
                <span>{t(lang, "completion")}</span>
                <span className="tabular-nums">
                  {progress.done}/{progress.req} · {progress.pts} {t(lang, "ptsToday")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
            <MacrosCard lang={lang} macros={macros} settings={settings} />
          </>
        ) : null}

        <div className="mb-3 mt-5 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "tasks")}</h2>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-xs font-medium text-accent hover:bg-surface"
          >
            <Plus className="size-3.5" />
            {t(lang, "addTask")}
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyDay
            lang={lang}
            onAdd={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            onTemplate={() => store.getState().applyTemplate()}
          />
        ) : (
          <ol ref={scroller} className="timeline">
            {tasks.map((task) => {
              const done = log?.done[task.id];
              const isCurrent = task.id === currentId;
              return (
                <li key={task.id} data-task={task.id} className="relative">
                  <TaskCard
                    task={task}
                    lang={lang}
                    done={done}
                    current={isCurrent}
                    foodText={log?.foodLog[task.id]?.text}
                    onComplete={() => handleComplete(task)}
                    onUndo={() => store.getState().uncompleteTask(task.id)}
                    onEdit={() => {
                      setEditing(task);
                      setEditorOpen(true);
                    }}
                    fmt={fmt}
                  />
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {!aiOpen ? (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="fixed bottom-5 end-5 z-20 flex h-12 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg shadow-panel"
        >
          <MessageSquare className="size-4" />
          {t(lang, "assistant")}
        </button>
      ) : null}

      {toast ? (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 z-50 w-[min(340px,calc(100%-2rem))] -translate-x-1/2 rounded-md border px-4 py-3 text-center text-sm font-medium shadow-panel",
            toast.kind === "warn"
              ? "border-danger/40 bg-surface-2 text-danger"
              : toast.kind === "late"
                ? "border-warn/40 bg-surface-2 text-warn"
                : "border-success/40 bg-surface-2 text-success",
          )}
        >
          {toast.text}
        </div>
      ) : null}

      <SettingsSheet
        open={settingsOpen}
        lang={lang}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onPatch={(p) => store.getState().patchSettings(p)}
        onLang={(l) => store.getState().setLang(l)}
        onReset={() => {
          store.getState().resetAll();
          setSettingsOpen(false);
        }}
        onReplay={() => {
          store.getState().replaySetup();
          setSettingsOpen(false);
        }}
        onAddTask={() => {
          setSettingsOpen(false);
          setEditing(null);
          setEditorOpen(true);
        }}
      />
      <WeeklyReport
        open={reportOpen}
        lang={lang}
        iso={viewingISO}
        history={history}
        schedule={schedule}
        onClose={() => setReportOpen(false)}
      />
      <HistorySheet
        open={historyOpen}
        lang={lang}
        history={history}
        schedule={schedule}
        onClose={() => setHistoryOpen(false)}
        onOpenDay={(iso) => {
          store.getState().setViewing(iso);
          setHistoryOpen(false);
        }}
      />
      <TaskEditor
        open={editorOpen}
        lang={lang}
        jd={selectedJD}
        existing={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={(task, days) => store.getState().upsertTask(selectedJD, task, days)}
        onDelete={(id, days) => store.getState().deleteTask(id, days)}
      />
      <FoodModal
        open={Boolean(foodTask)}
        lang={lang}
        task={foodTask}
        saved={meals}
        onClose={() => setFoodTask(null)}
        onSave={(text, macro, estimated, keep) => {
          if (!foodTask) return;
          store.getState().logFood(foodTask, text, macro, estimated, keep);
          store.getState().showToast(t(lang, "toastFood"));
          setFoodTask(null);
        }}
      />
      <PrayerModal
        open={Boolean(prayerTask)}
        lang={lang}
        task={prayerTask}
        onClose={() => setPrayerTask(null)}
        onSave={(place, onTime) => {
          if (!prayerTask) return;
          store.getState().logPrayer(prayerTask, place, onTime);
          store.getState().showToast(t(lang, "toastPrayer"));
          setPrayerTask(null);
        }}
      />
      <AiPanel
        open={aiOpen}
        lang={lang}
        messages={chat}
        context={boardContext(store.getState())}
        onClose={() => setAiOpen(false)}
        onPush={(m) => store.getState().pushChat(m)}
        onClear={() => store.getState().clearChat()}
        onApply={(days) => store.getState().applyAiDays(days)}
      />
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex min-w-10 flex-col items-center">
      <div className="font-display text-lg font-semibold leading-none tabular-nums">{n}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-sm text-fg-muted hover:bg-surface hover:text-fg"
    >
      {children}
    </button>
  );
}

function MacrosCard({
  lang,
  macros,
  settings,
}: {
  lang: "ar" | "en";
  macros: ReturnType<typeof dayMacros>;
  settings: { kcalTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number; fiberTarget: number };
}) {
  const rows = [
    { key: "p", label: t(lang, "protein"), val: macros.p, max: settings.proteinTarget, bar: "bg-success" },
    { key: "c", label: t(lang, "carbs"), val: macros.c, max: settings.carbsTarget, bar: "bg-warn" },
    { key: "f", label: t(lang, "fat"), val: macros.f, max: settings.fatTarget, bar: "bg-cat-sleep" },
    { key: "b", label: t(lang, "fiber"), val: macros.b, max: settings.fiberTarget, bar: "bg-cat-swim" },
  ];
  return (
    <div className="mb-2 rounded-md border border-border bg-surface px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-fg-subtle">{t(lang, "nutrition")}</span>
        <span className="text-sm font-semibold tabular-nums">
          {Math.round(macros.k)} / {settings.kcalTarget} {t(lang, "kcal")}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-xs text-fg-muted">{r.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full", r.bar)}
                style={{ width: `${Math.min(100, r.max ? (r.val / r.max) * 100 : 0)}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-end text-xs tabular-nums text-fg-muted">
              {Math.round(r.val)}/{r.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  lang,
  done,
  current,
  foodText,
  onComplete,
  onUndo,
  onEdit,
  fmt,
}: {
  task: Task;
  lang: "ar" | "en";
  done?: { pts: number; status: string };
  current: boolean;
  foodText?: string;
  onComplete: () => void;
  onUndo: () => void;
  onEdit: () => void;
  fmt: (raw: string) => string;
}) {
  const name = lang === "ar" ? task.nameAr : task.name;
  const desc = lang === "ar" ? task.descAr : task.desc;
  const token = CATEGORY_META[task.category]?.token ?? "cat-free";
  const optional = !requiredTask(task);
  return (
    <article
      className={cn(
        "task-card mb-2 flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5",
        done && "opacity-70",
        current && "current-task",
      )}
      data-c={task.category}
      style={{ borderInlineStartColor: `var(--color-${token})` }}
    >
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-start">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-bg text-fg-muted">
            <CatIcon category={task.category} className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{name}</h3>
              {optional ? (
                <span className="rounded-full border border-border px-1.5 py-px text-xs text-fg-subtle">
                  {t(lang, "optional")}
                </span>
              ) : null}
              {current ? (
                <span className="rounded-full bg-accent/15 px-1.5 py-px text-xs font-medium text-accent">
                  {t(lang, "current")}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-xs tabular-nums text-fg-subtle">
              {fmt(task.start)}
              {task.end ? ` – ${fmt(task.end)}` : ""}
              <span className="mx-1.5">·</span>
              {CAT_LABEL[task.category]?.[lang] ?? task.category}
              <span className="mx-1.5">·</span>
              {task.pts}
            </div>
          </div>
        </div>
        {desc ? <p className="mt-2 text-xs leading-relaxed text-fg-muted">{desc}</p> : null}
        {foodText ? <p className="mt-1.5 text-xs text-fg-subtle">{foodText}</p> : null}
      </button>
      {done ? (
        <button
          type="button"
          onClick={onUndo}
          aria-label={lang === "ar" ? "تراجع" : "Undo"}
          className="flex size-11 shrink-0 flex-col items-center justify-center rounded-sm border border-border text-fg-muted"
        >
          <Undo2 className="size-3.5" />
          <span className="text-xs tabular-nums">+{done.pts}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          aria-label={task.foodLog ? t(lang, "logFood") : task.category === "prayer" ? t(lang, "pray") : t(lang, "done")}
          className="flex size-11 shrink-0 flex-col items-center justify-center rounded-sm border border-success/40 bg-success/10 text-success"
        >
          <Check className="size-3.5" />
          <span className="text-xs">{task.pts}</span>
        </button>
      )}
    </article>
  );
}

function EmptyDay({
  lang,
  onAdd,
  onTemplate,
}: {
  lang: "ar" | "en";
  onAdd: () => void;
  onTemplate: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface px-5 py-10 text-center">
      <p className="text-sm text-fg-muted">{t(lang, "noTasks")}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Btn onClick={onAdd}>{t(lang, "addTask")}</Btn>
        <Btn variant="ghost" onClick={onTemplate}>
          {lang === "ar" ? "استخدم القالب" : "Use focus template"}
        </Btn>
      </div>
    </div>
  );
}

function currentTaskId(tasks: Task[], nowMin: number): string | null {
  for (const task of tasks) {
    const start = toMinutes(task.start);
    const end = task.end ? toMinutes(task.end) : start + 40;
    if (nowMin >= start && nowMin < end) return task.id;
  }
  return null;
}
