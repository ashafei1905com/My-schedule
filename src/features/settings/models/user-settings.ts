import type { Lang } from "@/shared/lib/i18n";

export interface UserSettings {
  lang: Lang;
  trackPrayers: boolean;
  showTracking: boolean;
  displayName: string;
  workspaceName: string;
  buildMode: "template" | "custom";
  onboardingComplete: boolean;
  notifEnabled: boolean;
  city: string;
  country: string;
  kcalTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  fiberTarget: number;
  peakStart: string;
  peakEnd: string;
  logoff: string;
  appIcon: string;
  themeAccent: string;
  themeCard: string;
  themeBg: string;
  themePresetId: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  lang: "en",
  trackPrayers: true,
  showTracking: true,
  displayName: "",
  workspaceName: "",
  buildMode: "template",
  onboardingComplete: true,
  notifEnabled: false,
  city: "Kuwait",
  country: "Kuwait",
  kcalTarget: 2200,
  proteinTarget: 160,
  carbsTarget: 220,
  fatTarget: 70,
  fiberTarget: 30,
  peakStart: "08:00",
  peakEnd: "11:00",
  logoff: "17:30",
  appIcon: "🏋️",
  themeAccent: "#3b82f6",
  themeCard: "#111827",
  themeBg: "#0a0e1a",
  themePresetId: "ocean",
};

export const APP_ICONS = ["🏋️", "📅", "⚡", "🌙", "🔥", "💎", "🧠", "🛡️", "⭐", "🎯"] as const;
