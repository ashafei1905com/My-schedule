import type { WeekSchedule } from "./task";

export const DAY_NAMES = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
} as const;

export const DAY_SHORT = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
} as const;

export function emptyWeek(): WeekSchedule {
  const week: WeekSchedule = {};
  for (let i = 0; i < 7; i++) {
    week[i] = {
      name: DAY_NAMES.en[i],
      nameAr: DAY_NAMES.ar[i],
      wake: "07:00",
      bed: "23:00",
      gym: null,
      tasks: [],
    };
  }
  return week;
}

export function cloneWeek(week: WeekSchedule): WeekSchedule {
  return JSON.parse(JSON.stringify(week)) as WeekSchedule;
}
