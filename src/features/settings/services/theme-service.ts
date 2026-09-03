import { MYTHIC_THEMES, THEME_PRESETS } from "@/features/settings/models/themes";
import type { UserSettings } from "@/features/settings/models/user-settings";

export function applyDocumentTheme(settings: UserSettings, mythicId: string | null) {
  if (typeof document === "undefined") return;
  const mythic = mythicId ? MYTHIC_THEMES.find((t) => t.id === mythicId) : undefined;
  const accent = mythic?.accent || settings.themeAccent || "#3b82f6";
  const card = mythic?.card || settings.themeCard || "#111827";
  const bg = mythic?.bg || settings.themeBg || "#0a0e1a";
  const root = document.documentElement.style;
  root.setProperty("--color-bg", bg);
  root.setProperty("--color-bg-elevated", mix(bg, "#ffffff", 0.04));
  root.setProperty("--color-surface", card);
  root.setProperty("--color-surface-2", mix(card, "#ffffff", 0.06));
  root.setProperty("--color-accent", accent);
  root.setProperty("--color-ring", accent);
  root.setProperty("--color-primary", accent);
  root.setProperty("--color-primary-fg", luminance(accent) > 0.62 ? "#0b1220" : "#ffffff");
  root.setProperty("--color-accent-fg", luminance(accent) > 0.62 ? "#0b1220" : "#ffffff");
  document.body.style.background = bg;
}

export function paletteById(id: string) {
  return THEME_PRESETS.find((p) => p.id === id);
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const bl = Math.round(A.b + (B.b - A.b) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
