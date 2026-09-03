const TZ = "Asia/Kuwait";

const WEEKDAY_TO_JD: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

export function kuwaitParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const o: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") o[p.type] = p.value;
  }
  return o;
}

export function todayISO(date = new Date()): string {
  const p = kuwaitParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

export function todayJD(date = new Date()): number {
  const p = kuwaitParts(date);
  return WEEKDAY_TO_JD[p.weekday] ?? 0;
}

export function kuwaitNowMinutes(date = new Date()): number {
  const p = kuwaitParts(date);
  const hh = Number.parseInt(p.hour === "24" ? "0" : p.hour, 10);
  const mm = Number.parseInt(p.minute, 10);
  return hh * 60 + mm;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function cleanTime(raw: string | undefined | null): string {
  if (!raw) return "";
  const m = String(raw).match(/\d{1,2}:\d{2}/);
  return m ? m[0] : String(raw);
}

/** Parse "9:15 ص", "21:00", or "9:15 م" into minutes since midnight. */
export function toMinutes(raw: string | undefined | null): number {
  if (!raw) return 0;
  const s0 = cleanTime(raw);
  const [hStr, mStr] = s0.split(":");
  const h = Number(hStr);
  const m = Number(mStr) || 0;
  const text = String(raw);
  const hasAr = text.includes("ص") || text.includes("م");
  if (hasAr) {
    const pm = text.includes("م");
    let hr = h;
    if (pm && h !== 12) hr += 12;
    if (!pm && h === 12) hr = 0;
    return hr * 60 + m;
  }
  return h * 60 + m;
}

export function minutesTo24h(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`;
}

export function formatArabicTime(raw: string | undefined | null): string {
  const s = cleanTime(raw);
  if (!s) return "";
  const [hStr, mStr] = s.split(":");
  let h = Number(hStr);
  const m = Number(mStr) || 0;
  const text = String(raw ?? "");
  if (text.includes("ص") || text.includes("م")) return `${h}:${pad2(m)} ${text.includes("م") ? "م" : "ص"}`;
  const pm = h >= 12;
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${dh}:${pad2(m)} ${pm ? "م" : "ص"}`;
}

export function formatEnglishTime(raw: string | undefined | null): string {
  const mins = toMinutes(raw);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const pm = h24 >= 12;
  const dh = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${dh}:${pad2(m)} ${pm ? "PM" : "AM"}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Saturday-start week (Gulf). Returns YYYY-MM-DD of that week's Saturday. */
export function weekStartSaturday(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const utcDay = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const offsetFromSat = (utcDay + 1) % 7;
  return addDaysISO(iso, -offsetFromSat);
}

export function dateForWeekday(jd: number, refISO: string): string {
  const start = weekStartSaturday(refISO);
  const offsetFromSat = (jd + 1) % 7;
  return addDaysISO(start, offsetFromSat);
}

export function jdFromISO(iso: string): number {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}
