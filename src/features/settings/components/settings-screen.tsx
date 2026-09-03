import * as Dialog from "@radix-ui/react-dialog";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { getRankMeta, prestigeMultiplier } from "@/features/points/services/rank-service";
import { MYTHIC_THEMES, THEME_PRESETS } from "@/features/settings/models/themes";
import { APP_ICONS } from "@/features/settings/models/user-settings";
import { t, type Lang } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

type Sec =
  | "general"
  | "tracking"
  | "notifications"
  | "reports"
  | "appearance"
  | "prestige"
  | "language"
  | "account";

const NAV: { id: Sec; ar: string; en: string }[] = [
  { id: "general", ar: "عام", en: "General" },
  { id: "tracking", ar: "التتبع", en: "Tracking" },
  { id: "notifications", ar: "التذكيرات", en: "Reminders" },
  { id: "reports", ar: "التقارير", en: "Reports" },
  { id: "appearance", ar: "المظهر", en: "Appearance" },
  { id: "prestige", ar: "مركز الامتياز", en: "Perfection Center" },
  { id: "language", ar: "اللغة", en: "Language" },
  { id: "account", ar: "الحساب", en: "Account" },
];

export function SettingsScreen({
  open,
  onOpenChange,
  onAddTask,
  onOpenHistory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddTask: () => void;
  onOpenHistory: () => void;
}) {
  const lang = useAppStore((s) => s.settings.lang);
  const settings = useAppStore((s) => s.settings);
  const stats = useAppStore((s) => s.stats);
  const patch = useAppStore((s) => s.patchSettings);
  const replay = useAppStore((s) => s.replayOnboarding);
  const reset = useAppStore((s) => s.resetLocal);
  const rebirth = useAppStore((s) => s.doRebirth);
  const unlock = useAppStore((s) => s.unlockMythic);
  const [sec, setSec] = useState<Sec>("general");
  const en = lang === "en";
  const rank = getRankMeta(stats.lifetime_xp || 0);
  const xp = stats.lifetime_xp || 0;
  const can = xp >= 3500;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-bg text-fg outline-none">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-lg font-black">{en ? "⚙️ Settings" : "⚙️ الإعدادات"}</Dialog.Title>
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              {t(lang, "close")}
            </Button>
          </header>

          <div className="flex min-h-0 flex-1">
            <nav className="no-scrollbar w-[min(200px,38vw)] shrink-0 overflow-y-auto border-e border-border p-3">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSec(n.id)}
                  className={`mb-1 w-full rounded-[10px] px-3.5 py-3 text-start text-[0.85rem] font-bold ${
                    sec === n.id ? "bg-accent/15 text-accent" : "text-fg-muted hover:bg-white/5 hover:text-fg"
                  }`}
                >
                  {en ? n.en : n.ar}
                </button>
              ))}
            </nav>

            <div className="no-scrollbar min-w-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="max-w-[520px]">
                {sec === "general" ? (
                  <Section title={en ? "General" : "عام"} desc={en ? "Manage your daily tasks here." : "إدارة مهامك اليومية من هنا."}>
                    <Field label={t(lang, "displayName")}>
                      <Input value={settings.displayName} onChange={(e) => patch({ displayName: e.target.value })} />
                    </Field>
                    <Field label={t(lang, "workspace")} className="mt-3">
                      <Input value={settings.workspaceName} onChange={(e) => patch({ workspaceName: e.target.value })} />
                    </Field>
                    <Button
                      className="mt-4 w-full"
                      variant="secondary"
                      onClick={() => {
                        onOpenChange(false);
                        onAddTask();
                      }}
                    >
                      {en ? "➕ Add task for today" : "➕ إضافة مهمة لليوم الحالي"}
                    </Button>
                  </Section>
                ) : null}

                {sec === "tracking" ? (
                  <Section
                    title={en ? "Tracking" : "التتبع"}
                    desc={en ? "Show or hide points and prayer tracking." : "أظهر أو أخفِ أنظمة النقاط والصلاة."}
                  >
                    <Row label={t(lang, "showTracking")}>
                      <Switch checked={settings.showTracking} onCheckedChange={(v) => patch({ showTracking: v })} />
                    </Row>
                    <Row label={t(lang, "trackPrayers")}>
                      <Switch checked={settings.trackPrayers} onCheckedChange={(v) => patch({ trackPrayers: v })} />
                    </Row>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Field label={t(lang, "city")}>
                        <Input value={settings.city} onChange={(e) => patch({ city: e.target.value })} />
                      </Field>
                      <Field label={t(lang, "country")}>
                        <Input value={settings.country} onChange={(e) => patch({ country: e.target.value })} />
                      </Field>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {(
                        [
                          ["kcalTarget", "kcal"],
                          ["proteinTarget", "protein"],
                          ["carbsTarget", "carbs"],
                          ["fatTarget", "fat"],
                        ] as const
                      ).map(([key, label]) => (
                        <Field key={key} label={t(lang, label)}>
                          <Input
                            type="number"
                            value={settings[key]}
                            onChange={(e) => patch({ [key]: Number(e.target.value) })}
                          />
                        </Field>
                      ))}
                    </div>
                  </Section>
                ) : null}

                {sec === "notifications" ? (
                  <Section
                    title={en ? "Reminders" : "التذكيرات"}
                    desc={en ? "Turn task notifications on or off." : "تفعيل أو إيقاف إشعارات المهام."}
                  >
                    <Row label={en ? (settings.notifEnabled ? "🔔 On" : "🔕 Reminders") : settings.notifEnabled ? "🔔 مفعّلة" : "🔕 التذكيرات"}>
                      <Switch checked={settings.notifEnabled} onCheckedChange={(v) => patch({ notifEnabled: v })} />
                    </Row>
                  </Section>
                ) : null}

                {sec === "reports" ? (
                  <Section
                    title={en ? "Reports" : "التقارير"}
                    desc={en ? "Previous weekly reports." : "سجل التقارير الأسبوعية السابقة."}
                  >
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenHistory();
                      }}
                    >
                      {en ? "🗂️ Report history" : "🗂️ سجل التقارير"}
                    </Button>
                  </Section>
                ) : null}

                {sec === "appearance" ? (
                  <Appearance lang={lang} />
                ) : null}

                {sec === "prestige" ? (
                  <Section
                    title={en ? "Perfection Center" : "مركز الامتياز"}
                    desc={en ? "Lifetime XP, rebirth tokens, and rare theme rewards." : "الخبرة الدائمة، رموز الامتياز، ومكافآت المظاهر النادرة."}
                  >
                    <h4 className="mt-1 text-sm font-black">{en ? "Progress Hub" : "نظام الامتياز الزمني"}</h4>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-fg-muted">
                      {en
                        ? `Lifetime XP: ${xp} · ${rank.icon} ${rank.title} · Prestige ${stats.prestige_level || 0} · Tokens ${stats.rebirth_tokens || 0} · Multiplier x${prestigeMultiplier(stats.prestige_level || 0).toFixed(2)}`
                        : `خبرة دائمة: ${xp} · ${rank.icon} ${rank.titleAr} · امتياز ${stats.prestige_level || 0} · رموز ${stats.rebirth_tokens || 0} · مضاعف x${prestigeMultiplier(stats.prestige_level || 0).toFixed(2)}`}
                    </p>
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-[11px] font-bold text-fg-muted">
                        <span>{en ? "Lifetime XP Tracker" : "متتبع نقاط الخبرة الدائمة"}</span>
                        <span>
                          {Math.min(xp, 3500)} / 3500 {en ? "XP" : "نقطة"}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${Math.min(100, Math.round((xp / 3500) * 100))}%` }}
                        />
                      </div>
                    </div>
                    {can ? (
                      <Button
                        className="mt-4 w-full"
                        variant="secondary"
                        onClick={() => {
                          const ok = window.confirm(
                            en
                              ? "Upgrade prestige rank? Lifetime XP resets to 0, your points multiplier increases permanently, and you earn 1 Mythic Prestige Token."
                              : "ترقية رتبة الامتياز؟ سيتم تصفير نقاط الخبرة الدائمة، ويزداد مضاعف النقاط، وتحصل على رمز امتياز واحد.",
                          );
                          if (!ok) return;
                          if (rebirth()) {
                            toast.success(en ? "Prestige upgrade complete" : "اكتملت ترقية الامتياز");
                          }
                        }}
                      >
                        {en ? "🌌 Trigger Galactic Rebirth" : "🌌 ترقية رتبة الامتياز والتصفير"}
                      </Button>
                    ) : (
                      <p className="mt-3 text-[0.78rem] text-fg-subtle">
                        {en
                          ? "Reach Time Lord (3500+ Lifetime XP) to unlock prestige upgrade."
                          : "للوصول لترقية الامتياز تحتاج 3500+ من نقاط الخبرة الدائمة."}
                      </p>
                    )}

                    <h4 className="mt-8 text-sm font-black">{en ? "Rare Themes Shop" : "متجر المظاهر النادرة"}</h4>
                    <p className="mt-1 mb-3 text-[0.78rem] text-fg-muted">
                      {en ? "Spend Rebirth Tokens to unlock rewards." : "أنفق رموز الامتياز لفتح المكافآت."}
                    </p>
                    <div className="flex flex-col gap-3">
                      {MYTHIC_THEMES.map((th) => {
                        const own = (stats.unlockedThemes || []).includes(th.id);
                        return (
                          <div
                            key={th.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                          >
                            <div className="min-w-0">
                              <h5 className="font-bold">{en ? th.name : th.nameAr}</h5>
                              <p className="mt-0.5 text-[0.72rem] leading-snug text-fg-muted">{en ? th.desc : th.descAr}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="shrink-0 border-accent/50 text-accent"
                              disabled={own}
                              onClick={() => {
                                const ok = unlock(th.id);
                                toast[ok ? "success" : "error"](
                                  ok
                                    ? en
                                      ? "Theme unlocked. Activate it from Appearance."
                                      : "تم الفتح. فعّله من المظهر."
                                    : en
                                      ? "Not enough tokens."
                                      : "الرموز غير كافية.",
                                );
                              }}
                            >
                              {own
                                ? en
                                  ? "Unlocked"
                                  : "تم الفتح"
                                : en
                                  ? `Unlock (${th.cost} token${th.cost > 1 ? "s" : ""})`
                                  : `فتح قفل (${th.cost} رمز)`}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                ) : null}

                {sec === "language" ? (
                  <Section title={en ? "Language" : "اللغة / Language"} desc={en ? "App interface language." : "واجهة التطبيق."}>
                    <div className="flex flex-col gap-2">
                      <Button variant={lang === "ar" ? "default" : "secondary"} onClick={() => patch({ lang: "ar" })}>
                        العربية
                      </Button>
                      <Button variant={lang === "en" ? "default" : "secondary"} onClick={() => patch({ lang: "en" })}>
                        English
                      </Button>
                    </div>
                  </Section>
                ) : null}

                {sec === "account" ? (
                  <Section title={en ? "Account" : "الحساب"} desc={en ? "Manage your session." : "إدارة جلسة الدخول."}>
                    <div className="flex flex-col gap-2">
                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                      <SignedOut>
                        <Button asChild variant="secondary">
                          <Link to="/login">{t(lang, "signIn")}</Link>
                        </Button>
                      </SignedOut>
                      <Button variant="secondary" onClick={replay}>
                        {t(lang, "replaySetup")}
                      </Button>
                      <Button variant="danger" onClick={reset}>
                        {t(lang, "reset")}
                      </Button>
                    </div>
                  </Section>
                ) : null}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Appearance({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const settings = useAppStore((s) => s.settings);
  const stats = useAppStore((s) => s.stats);
  const patch = useAppStore((s) => s.patchSettings);
  const activate = useAppStore((s) => s.activateMythic);
  const custom = settings.themePresetId === "custom";

  return (
    <Section
      title={en ? "Appearance" : "المظهر"}
      desc={en ? "App icon and schedule colors." : "أيقونة التطبيق وألوان الجدول."}
    >
      <div className="flex flex-wrap gap-2.5">
        {APP_ICONS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => patch({ appIcon: ic })}
            className={`flex size-12 items-center justify-center rounded-xl border-2 bg-surface text-xl ${
              settings.appIcon === ic ? "border-accent" : "border-border"
            }`}
          >
            {ic}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[0.78rem] text-fg-muted">
        {en
          ? "After choosing, remove the app from the home screen and add it again to refresh the icon."
          : "بعد الاختيار، احذف التطبيق من الشاشة الرئيسية وأضفه من جديد لتحديث الأيقونة."}
      </p>
      <p className="mt-5 text-[0.78rem] font-bold text-fg-muted">{en ? "Color palette" : "لوحة الألوان"}</p>
      <div className="no-scrollbar mt-2 flex gap-3.5 overflow-x-auto py-2">
        {THEME_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              patch({
                themePresetId: p.id,
                themeAccent: p.accent,
                themeCard: p.card,
                themeBg: p.bg,
              })
            }
            className="flex shrink-0 flex-col items-center gap-2"
          >
            <span
              className={`size-14 rounded-full border-[3px] ${
                settings.themePresetId === p.id && !stats.activeMythicTheme ? "border-white shadow-[0_0_0_3px_var(--color-accent)]" : "border-transparent"
              }`}
              style={{ background: `linear-gradient(135deg, ${p.accent} 0 40%, ${p.card} 40% 70%, ${p.bg} 70% 100%)` }}
            />
            <span className="max-w-[76px] text-center text-[0.68rem] font-bold text-fg-muted">
              {en ? p.name : p.nameAr}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => patch({ themePresetId: "custom" })}
          className="flex shrink-0 flex-col items-center gap-2"
        >
          <span
            className={`flex size-14 items-center justify-center rounded-full border-[3px] bg-surface text-lg ${
              custom ? "border-white shadow-[0_0_0_3px_var(--color-accent)]" : "border-transparent"
            }`}
          >
            ✦
          </span>
          <span className="max-w-[76px] text-center text-[0.68rem] font-bold text-fg-muted">
            {en ? "Custom" : "مخصص"}
          </span>
        </button>
      </div>
      {custom ? (
        <div className="mt-3 space-y-2 rounded-xl border border-border bg-surface p-3.5">
          {(
            [
              ["themeAccent", en ? "Accent" : "لون التمييز"],
              ["themeCard", en ? "Card" : "لون البطاقة"],
              ["themeBg", en ? "Background" : "لون الخلفية"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
              <span className="text-[0.82rem] font-bold">{label}</span>
              <input
                type="color"
                value={settings[key]}
                onChange={(e) => patch({ [key]: e.target.value, themePresetId: "custom" })}
                className="h-8 w-11 cursor-pointer border-0 bg-transparent"
              />
            </div>
          ))}
        </div>
      ) : null}

      <h4 className="mt-6 text-sm font-black">{en ? "Unlocked Rare Themes" : "المظاهر النادرة المفتوحة"}</h4>
      <p className="mt-1 mb-3 text-[0.78rem] text-fg-muted">
        {en ? "Activate themes you unlocked in Perfection Center." : "فعّل المظاهر التي فتحتها من مركز الامتياز."}
      </p>
      {(stats.unlockedThemes || []).length === 0 ? (
        <p className="text-[0.78rem] text-fg-muted">
          {en ? "No rare themes unlocked yet. Earn tokens in Perfection Center." : "لا توجد مظاهر نادرة مفتوحة بعد. اجمع الرموز من مركز الامتياز."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {MYTHIC_THEMES.filter((th) => (stats.unlockedThemes || []).includes(th.id)).map((th) => {
            const on = stats.activeMythicTheme === th.id;
            return (
              <div key={th.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div>
                  <h5 className="font-bold">{en ? th.name : th.nameAr}</h5>
                  <p className="text-[0.72rem] text-fg-muted">{en ? th.desc : th.descAr}</p>
                </div>
                <Button size="sm" variant={on ? "default" : "secondary"} onClick={() => activate(on ? null : th.id)}>
                  {on ? (en ? "Active" : "مفعّل حالياً") : en ? "Activate Theme" : "تفعيل المظهر"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-black">{title}</h3>
      <p className="mb-4 mt-1.5 text-[0.78rem] leading-relaxed text-fg-muted">{desc}</p>
      {children}
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[0.72rem] font-bold text-fg-muted">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3.5">
      <span className="text-[0.88rem] font-bold">{label}</span>
      {children}
    </div>
  );
}
