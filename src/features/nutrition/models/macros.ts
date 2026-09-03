export interface Macros {
  p: number;
  c: number;
  f: number;
  b: number;
  k: number;
}

export const EMPTY_MACROS: Macros = { p: 0, c: 0, f: 0, b: 0, k: 0 };

export const MACROS_GYM = {
  breakfast: { p: 26, c: 75, f: 17, b: 8, k: 560 },
  middaySnack: { p: 5, c: 25, f: 10, b: 4, k: 200 },
  lunch: { p: 45, c: 40, f: 15, b: 6, k: 480 },
  preGymSnack: { p: 21, c: 67, f: 24, b: 5, k: 570 },
  dinner: { p: 33, c: 28, f: 17, b: 5, k: 400 },
} as const satisfies Record<string, Macros>;

export const MACROS_REST = {
  breakfast: { p: 31, c: 41, f: 19, b: 5, k: 465 },
  middaySnack: { p: 5, c: 25, f: 10, b: 4, k: 200 },
  lunch: { p: 45, c: 45, f: 15, b: 6, k: 500 },
  afternoonSnack: { p: 2, c: 35, f: 1, b: 5, k: 150 },
  dinner: { p: 27, c: 23, f: 16, b: 5, k: 350 },
} as const satisfies Record<string, Macros>;

export function mealKeyFor(base: string, isGym: boolean): string {
  return `${isGym ? "gym" : "rest"}:${base}`;
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    p: a.p + b.p,
    c: a.c + b.c,
    f: a.f + b.f,
    b: a.b + b.b,
    k: a.k + b.k,
  };
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    p: m.p * factor,
    c: m.c * factor,
    f: m.f * factor,
    b: m.b * factor,
    k: m.k * factor,
  };
}

export function roundMacros(m: Macros): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return { p: r1(m.p), c: r1(m.c), f: r1(m.f), b: r1(m.b), k: r1(m.k) };
}
