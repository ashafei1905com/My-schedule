import type { Macros } from "@/features/nutrition/models/macros";
import type { DaySchedule, Task, WeekSchedule } from "@/features/schedule/models/task";
import { emptyWeek } from "@/features/schedule/models/week";

const REST_MEALS = {
  breakfast: { p: 31, c: 41, f: 19, b: 5, k: 465 },
  lunch: { p: 45, c: 45, f: 15, b: 6, k: 500 },
  dinner: { p: 27, c: 23, f: 16, b: 5, k: 350 },
  snack: { p: 5, c: 25, f: 10, b: 4, k: 200 },
} satisfies Record<string, Macros>;

const GYM_MEALS = {
  breakfast: { p: 26, c: 75, f: 17, b: 8, k: 560 },
  lunch: { p: 45, c: 40, f: 15, b: 6, k: 480 },
  dinner: { p: 33, c: 28, f: 17, b: 5, k: 400 },
  pre: { p: 21, c: 67, f: 24, b: 5, k: 570 },
} satisfies Record<string, Macros>;

function task(
  partial: Omit<Task, "notify" | "nameAr" | "descAr"> & {
    nameAr?: string;
    descAr?: string;
    notify?: boolean;
  },
): Task {
  return {
    notify: true,
    nameAr: partial.nameAr ?? partial.name,
    descAr: partial.descAr ?? partial.desc,
    ...partial,
  };
}

function meal(
  id: string,
  start: string,
  end: string,
  names: [string, string],
  descs: [string, string],
  macros: Macros,
  mealKey: string,
  optional = false,
): Task {
  return task({
    id,
    start,
    end,
    category: optional ? "snack" : "food",
    name: names[0],
    nameAr: names[1],
    desc: descs[0],
    descAr: descs[1],
    pts: 5,
    optional,
    foodLog: true,
    mealKey,
    targetMacros: macros,
  });
}

export interface TemplateOpts {
  peakStart: string;
  peakEnd: string;
  logoff: string;
  trackPrayers: boolean;
}

function deepWork(id: string, start: string, end: string, label: [string, string], pts = 30): Task {
  return task({
    id,
    start,
    end,
    category: "prog",
    name: label[0],
    nameAr: label[1],
    desc: "Uninterrupted block. Phone down, one outcome.",
    descAr: "بلوك بدون مقاطعة. تليفون بعيد، هدف واحد.",
    pts,
  });
}

function admin(id: string, start: string, end: string): Task {
  return task({
    id,
    start,
    end,
    category: "admin",
    name: "Admin sweep",
    nameAr: "مهام إدارية",
    desc: "Mail, quick replies, light coordination.",
    descAr: "إيميلات، ردود سريعة، تنسيق خفيف.",
    pts: 10,
  });
}

function gym(id: string, start: string, end: string, kind: "upper" | "lower"): Task {
  return task({
    id,
    start,
    end,
    category: "gym",
    name: kind === "upper" ? "Gym — upper" : "Gym — lower",
    nameAr: kind === "upper" ? "جيم — علوي" : "جيم — سفلي",
    desc:
      kind === "upper"
        ? "Press, pull, arms. 20 min walk after."
        : "Squat pattern, hinge, calves. 20 min walk after.",
    descAr:
      kind === "upper" ? "ضغط وسحب وذراعين. مشي ٢٠ دقيقة بعد." : "سكوات وديدلفت وسمانة. مشي ٢٠ دقيقة بعد.",
    pts: 25,
  });
}

function quran(id: string, start: string, end: string): Task {
  return task({
    id,
    start,
    end,
    category: "quran",
    name: "Daily wird",
    nameAr: "الورد اليومي",
    desc: "Fifteen quiet minutes.",
    descAr: "ربع ساعة بهدوء.",
    pts: 10,
  });
}

function sleep(id: string, start: string): Task {
  return task({
    id,
    start,
    end: addHours(start, 0.5),
    category: "sleep",
    name: "Lights out",
    nameAr: "نوم على الوقت",
    desc: "Same bedtime. Protect tomorrow's peak.",
    descAr: "نفس المعاد. احمِ تركيز بكرة.",
    pts: 10,
  });
}

function free(id: string, start: string, end: string): Task {
  return task({
    id,
    start,
    end,
    category: "free",
    name: "Open block",
    nameAr: "وقت حر",
    desc: "Walk, call, or nothing.",
    descAr: "تمشية، مكالمة، أو ولا حاجة.",
    pts: 5,
    optional: true,
  });
}

export function addHours(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function bufferAfter(end: string, minutes = 15): string {
  return addHours(end, minutes / 60);
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}

export function buildFocusWeek(opts: TemplateOpts): WeekSchedule {
  const week = emptyWeek();
  const peakStart = opts.peakStart || "08:00";
  const peakEnd = opts.peakEnd || "11:00";
  const mid = addHours(peakStart, 1.5);
  const afterPeak = bufferAfter(peakEnd, 10);
  const logoff = opts.logoff || "17:30";

  const gymMap: Record<number, "upper" | "lower" | null> = {
    0: null,
    1: "lower",
    2: null,
    3: "upper",
    4: null,
    5: null,
    6: "upper",
  };

  for (let jd = 0; jd < 7; jd++) {
    const isGym = Boolean(gymMap[jd]);
    const meals = isGym ? GYM_MEALS : REST_MEALS;
    const friday = jd === 5;
    const tasks: Task[] = [];

    tasks.push(
      meal(
        `${jd}-bk`,
        addHours(peakStart, -0.75),
        addHours(peakStart, -0.15),
        ["Breakfast", "الفطار"],
        isGym
          ? ["Fava beans, olive oil, brown loaf, cucumber.", "فول، زيت زيتون، رغيف أسمر، خيار."]
          : ["Cottage cheese, brown toast, milk, cucumber.", "جبنة قريش، توست أسمر، لبن، خيار."],
        meals.breakfast,
        `${isGym ? "gym" : "rest"}:breakfast`,
      ),
    );

    tasks.push(quran(`${jd}-wd`, addHours(peakStart, -0.15), peakStart));

    if (!friday) {
      tasks.push(deepWork(`${jd}-dw1`, peakStart, mid, ["Deep work I", "شغل عميق ١"]));
      tasks.push(deepWork(`${jd}-dw2`, bufferAfter(mid, 10), peakEnd, ["Deep work II", "شغل عميق ٢"]));
    } else {
      tasks.push(
        deepWork(`${jd}-dw1`, peakStart, addHours(peakStart, 2), ["Quiet review", "مراجعة هادية"], 20),
      );
    }

    tasks.push(
      meal(
        `${jd}-sn1`,
        afterPeak,
        addHours(afterPeak, 0.25),
        ["Mid-morning snack", "سناك منتصف النهار"],
        ["A handful of nuts and a piece of fruit.", "حفنة مكسرات وثمرة فاكهة."],
        REST_MEALS.snack,
        `${isGym ? "gym" : "rest"}:middaySnack`,
        true,
      ),
    );

    if (!friday) {
      tasks.push(admin(`${jd}-ad`, addHours(afterPeak, 0.3), addHours(afterPeak, 1.1)));
    }

    const lunchStart = friday ? "13:30" : "12:30";
    tasks.push(
      meal(
        `${jd}-lu`,
        lunchStart,
        addHours(lunchStart, 0.75),
        ["Lunch", "الغدا"],
        ["Protein, a measured carb, large salad.", "بروتين، كارب محسوب، سلطة كبيرة."],
        meals.lunch,
        `${isGym ? "gym" : "rest"}:lunch`,
      ),
    );

    if (jd === 1 || jd === 4) {
      tasks.push(deepWork(`${jd}-ss`, "12:00", "13:00", ["Craft session", "سيشن صنعة"], 15));
    }

    tasks.push(admin(`${jd}-ad2`, addHours(lunchStart, 1), addHours(lunchStart, 1.75)));

    if (isGym) {
      const gymStart = jd === 6 ? "15:00" : "17:00";
      tasks.push(
        meal(
          `${jd}-ps`,
          addHours(gymStart, -1),
          addHours(gymStart, -0.25),
          ["Pre-gym snack", "سناك قبل الجيم"],
          ["Oats, milk, banana, peanut butter.", "شوفان، لبن، موز، زبدة فول سوداني."],
          GYM_MEALS.pre,
          "gym:preGymSnack",
        ),
      );
      tasks.push(gym(`${jd}-gm`, gymStart, addHours(gymStart, 1.25), gymMap[jd]!));
      tasks.push(
        meal(
          `${jd}-pm`,
          addHours(gymStart, 1.5),
          addHours(gymStart, 2.1),
          ["Post-training meal", "وجبة بعد التمرين"],
          ["Eggs, cucumber, tomato.", "بيض، خيار، طماطم."],
          GYM_MEALS.dinner,
          "gym:dinner",
        ),
      );
    } else {
      tasks.push(free(`${jd}-fr`, logoff, addHours(logoff, 1.5)));
      tasks.push(
        meal(
          `${jd}-dn`,
          "20:00",
          "20:40",
          ["Dinner", "العشا"],
          ["Cottage cheese, half a brown loaf, vegetables.", "جبنة قريش، نصف رغيف أسمر، خضار."],
          REST_MEALS.dinner,
          "rest:dinner",
        ),
      );
    }

    tasks.push(
      meal(
        `${jd}-sn3`,
        "21:30",
        "21:50",
        ["Evening snack", "سناك مسائي"],
        ["Fruit or a few nuts if hungry.", "فاكهة أو مكسرات لو جعت."],
        REST_MEALS.snack,
        `${isGym ? "gym" : "rest"}:bedtimeSnack`,
        true,
      ),
    );

    const bed = isGym ? "00:00" : "23:00";
    tasks.push(sleep(`${jd}-sl`, bed));

    week[jd].wake = addHours(peakStart, -1);
    week[jd].bed = bed;
    week[jd].gym = gymMap[jd];
    week[jd].tasks = sortTasks(tasks);
  }

  return week;
}

export function applyBuiltDays(
  base: WeekSchedule,
  built: Partial<Record<number, DaySchedule["tasks"]>>,
): WeekSchedule {
  const next = JSON.parse(JSON.stringify(base)) as WeekSchedule;
  for (const key of Object.keys(built)) {
    const jd = Number(key);
    if (!next[jd]) continue;
    const tasks = built[jd];
    if (tasks) next[jd].tasks = sortTasks(tasks);
  }
  return next;
}

import type { TaskCategory } from "@/features/schedule/models/task";

export type { TaskCategory as Category };

