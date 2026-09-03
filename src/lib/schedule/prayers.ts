import { toMinutes, minutesTo24h } from "@/shared/lib/kuwait-time";
import type { PrayerTimes, Task } from "./types";
import { DEFAULT_PRAYERS } from "./types";

export const PRAYER_META: {
  key: keyof PrayerTimes;
  en: string;
  ar: string;
  pts: number;
  sunnahEn?: string;
  sunnahAr?: string;
}[] = [
  { key: "Fajr", en: "Fajr", ar: "الفجر", pts: 10, sunnahEn: "Two rak'ah before", sunnahAr: "سنة الفجر (ركعتان قبل)" },
  { key: "Sunrise", en: "Sunrise", ar: "الشروق", pts: 5 },
  { key: "Dhuhr", en: "Dhuhr", ar: "الظهر", pts: 10, sunnahEn: "Four before, two after", sunnahAr: "سنة الظهر (٤ قبل + ٢ بعد)" },
  { key: "Asr", en: "Asr", ar: "العصر", pts: 10 },
  { key: "Maghrib", en: "Maghrib", ar: "المغرب", pts: 10, sunnahEn: "Two rak'ah after", sunnahAr: "سنة المغرب (ركعتان بعد)" },
  { key: "Isha", en: "Isha", ar: "العشاء", pts: 10, sunnahEn: "Two rak'ah after", sunnahAr: "سنة العشاء (ركعتان بعد)" },
];

export async function fetchPrayerTimes(city: string, country: string): Promise<PrayerTimes> {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=9`;
  const res = await fetch(url);
  if (!res.ok) return DEFAULT_PRAYERS;
  const json = (await res.json()) as {
    data?: { timings?: Record<string, string> };
  };
  const t = json.data?.timings;
  if (!t) return DEFAULT_PRAYERS;
  const clean = (v: string) => (v || "").slice(0, 5);
  return {
    Fajr: clean(t.Fajr) || DEFAULT_PRAYERS.Fajr,
    Sunrise: clean(t.Sunrise) || DEFAULT_PRAYERS.Sunrise,
    Dhuhr: clean(t.Dhuhr) || DEFAULT_PRAYERS.Dhuhr,
    Asr: clean(t.Asr) || DEFAULT_PRAYERS.Asr,
    Maghrib: clean(t.Maghrib) || DEFAULT_PRAYERS.Maghrib,
    Isha: clean(t.Isha) || DEFAULT_PRAYERS.Isha,
  };
}

export function prayerTasks(times: PrayerTimes, friday: boolean): Task[] {
  return PRAYER_META.filter((p) => p.key !== "Sunrise").map((p) => {
    const start = times[p.key];
    const isJumuah = friday && p.key === "Dhuhr";
    return {
      id: `prayer-${p.key.toLowerCase()}`,
      start,
      end: minutesTo24h(toMinutes(start) + (isJumuah ? 60 : 25)),
      category: p.key === "Sunrise" ? "sunrise" : "prayer",
      name: isJumuah ? "Jumu'ah" : p.en,
      nameAr: isJumuah ? "صلاة الجمعة" : p.ar,
      desc: p.sunnahEn ?? "On time, with presence.",
      descAr: p.sunnahAr ?? "في وقتها، بخشوع.",
      pts: isJumuah ? 15 : p.pts,
      notify: true,
    } satisfies Task;
  });
}
