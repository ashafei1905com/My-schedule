export const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

export interface PrayerMeta {
  key: PrayerKey;
  ar: string;
  en: string;
  points: number;
  sunnahAr: string | null;
  sunnahEn: string | null;
}

export const PRAYER_META: PrayerMeta[] = [
  {
    key: "Fajr",
    ar: "الفجر",
    en: "Fajr",
    points: 10,
    sunnahAr: "سنة الفجر (ركعتان قبل)",
    sunnahEn: "Fajr sunnah (2 before)",
  },
  {
    key: "Dhuhr",
    ar: "الظهر",
    en: "Dhuhr",
    points: 10,
    sunnahAr: "سنة الظهر (٤ قبل + ٢ بعد)",
    sunnahEn: "Dhuhr sunnah (4 before + 2 after)",
  },
  {
    key: "Asr",
    ar: "العصر",
    en: "Asr",
    points: 10,
    sunnahAr: null,
    sunnahEn: null,
  },
  {
    key: "Maghrib",
    ar: "المغرب",
    en: "Maghrib",
    points: 10,
    sunnahAr: "سنة المغرب (ركعتان بعد)",
    sunnahEn: "Maghrib sunnah (2 after)",
  },
  {
    key: "Isha",
    ar: "العشاء",
    en: "Isha",
    points: 10,
    sunnahAr: "سنة العشاء (ركعتان بعد)",
    sunnahEn: "Isha sunnah (2 after)",
  },
];

export const FALLBACK_PRAYER_TIMES: Record<string, string> = {
  Fajr: "03:13",
  Sunrise: "04:50",
  Dhuhr: "11:51",
  Asr: "15:25",
  Maghrib: "18:51",
  Isha: "20:26",
};

export type PrayerTimes = Record<string, string>;

export type PrayerPlace = "mosque" | "home" | "work" | "other";

export interface PrayerLog {
  place: PrayerPlace;
  onTime: boolean;
  at: string;
}

export type PrayerLogsByDate = Record<string, Record<string, PrayerLog>>;
