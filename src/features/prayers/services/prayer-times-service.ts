import {
  FALLBACK_PRAYER_TIMES,
  PRAYER_KEYS,
  type PrayerTimes,
} from "@/features/prayers/models/prayer";
import { cleanTime, todayISO } from "@/shared/lib/kuwait-time";

const cache = new Map<string, PrayerTimes>();

export async function fetchPrayerTimes(
  city = "Kuwait",
  country = "Kuwait",
  date = todayISO(),
): Promise<PrayerTimes> {
  const key = `${city}|${country}|${date}`;
  const hit = cache.get(key);
  if (hit) return hit;

  try {
    const url = `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=9`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`prayer ${res.status}`);
    const body = (await res.json()) as {
      data?: { timings?: Record<string, string> };
    };
    const timings = body.data?.timings;
    if (!timings) throw new Error("no timings");
    const out: PrayerTimes = { ...FALLBACK_PRAYER_TIMES };
    for (const k of [...PRAYER_KEYS, "Sunrise"] as const) {
      if (timings[k]) out[k] = cleanTime(timings[k]);
    }
    cache.set(key, out);
    return out;
  } catch {
    cache.set(key, FALLBACK_PRAYER_TIMES);
    return FALLBACK_PRAYER_TIMES;
  }
}
