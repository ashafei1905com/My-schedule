export interface Palette {
  id: string;
  name: string;
  nameAr: string;
  accent: string;
  card: string;
  bg: string;
}

export const THEME_PRESETS: Palette[] = [
  { id: "ocean", name: "Ocean", nameAr: "محيط", accent: "#3b82f6", card: "#111827", bg: "#0a0e1a" },
  { id: "forest", name: "Forest", nameAr: "غابة", accent: "#10b981", card: "#0f1f18", bg: "#07140f" },
  { id: "sunset", name: "Sunset", nameAr: "غروب", accent: "#f59e0b", card: "#1f1710", bg: "#140e08" },
  { id: "rose", name: "Rose", nameAr: "وردي", accent: "#ec4899", card: "#1f1218", bg: "#14080e" },
  { id: "violet", name: "Violet", nameAr: "بنفسجي", accent: "#8b5cf6", card: "#16121f", bg: "#0c0814" },
  { id: "crimson", name: "Crimson", nameAr: "قرمزي", accent: "#ef4444", card: "#1f1212", bg: "#140808" },
  { id: "slate", name: "Slate", nameAr: "رمادي", accent: "#94a3b8", card: "#1e293b", bg: "#0f172a" },
];

export interface MythicTheme {
  id: string;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  cost: number;
  accent: string;
  glow: string;
  card: string;
  bg: string;
}

export const MYTHIC_THEMES: MythicTheme[] = [
  {
    id: "nebula",
    name: "Cosmic Nebula",
    nameAr: "سديم كوني",
    desc: "Living mesh nebula across the full dashboard with glass navigation and soft depth",
    descAr: "سديم حي عبر اللوحة مع تنقّل زجاجي وعمق ناعم",
    cost: 1,
    accent: "#7c3aed",
    glow: "#a78bfa",
    card: "#16102a",
    bg: "#0b0618",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Pulse",
    nameAr: "نبض سايبربانك",
    desc: "Neon terminal atmosphere, laser FAB scanlines, and high-contrast magenta",
    descAr: "أجواء طرفية نيون وخطوط مسح وردية عالية التباين",
    cost: 2,
    accent: "#ff00aa",
    glow: "#00ffff",
    card: "#1a0820",
    bg: "#09040f",
  },
  {
    id: "matrix",
    name: "Digital Rain",
    nameAr: "مطر رقمي",
    desc: "Phosphor green code rain over a black terminal board",
    descAr: "مطر شفرة أخضر فوق لوحة طرفية سوداء",
    cost: 2,
    accent: "#00ff66",
    glow: "#39ff14",
    card: "#06140c",
    bg: "#020805",
  },
  {
    id: "chrono",
    name: "Chrono Gold",
    nameAr: "ذهب الزمن",
    desc: "Gilded Time Lord finish with warm brass highlights",
    descAr: "لمسة سيد الزمن المذهب مع إبراز نحاسي دافئ",
    cost: 3,
    accent: "#d4af37",
    glow: "#f5e6b8",
    card: "#1a1508",
    bg: "#0c0a04",
  },
];
