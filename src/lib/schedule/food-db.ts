import type { Macros } from "./types";
import { EMPTY_MACROS, addMacros } from "./types";

interface FoodItem {
  keys: string[];
  per100: Macros;
  defaultGrams: number;
  name: string;
  nameAr: string;
}

const FOODS: FoodItem[] = [
  { keys: ["chicken", "فراخ", "دجاج"], per100: { p: 31, c: 0, f: 3.6, b: 0, k: 165 }, defaultGrams: 150, name: "Chicken breast", nameAr: "صدور فراخ" },
  { keys: ["rice", "رز", "أرز"], per100: { p: 2.7, c: 28, f: 0.3, b: 0.4, k: 130 }, defaultGrams: 180, name: "Cooked rice", nameAr: "رز مطبوخ" },
  { keys: ["bread", "عيش", "توست", "رغيف"], per100: { p: 9, c: 49, f: 3.2, b: 7, k: 265 }, defaultGrams: 60, name: "Brown bread", nameAr: "عيش أسمر" },
  { keys: ["egg", "بيض"], per100: { p: 13, c: 1.1, f: 11, b: 0, k: 155 }, defaultGrams: 100, name: "Eggs", nameAr: "بيض" },
  { keys: ["milk", "لبن", "حليب"], per100: { p: 3.4, c: 5, f: 3.3, b: 0, k: 61 }, defaultGrams: 250, name: "Milk", nameAr: "لبن" },
  { keys: ["yogurt", "زبادي", "زبد"], per100: { p: 10, c: 3.6, f: 0.4, b: 0, k: 59 }, defaultGrams: 150, name: "Yogurt", nameAr: "زبادي" },
  { keys: ["cottage", "قريش"], per100: { p: 11, c: 3.4, f: 4.3, b: 0, k: 98 }, defaultGrams: 150, name: "Cottage cheese", nameAr: "جبنة قريش" },
  { keys: ["oat", "شوفان"], per100: { p: 13, c: 67, f: 7, b: 10, k: 389 }, defaultGrams: 50, name: "Oats", nameAr: "شوفان" },
  { keys: ["banana", "موز"], per100: { p: 1.1, c: 23, f: 0.3, b: 2.6, k: 89 }, defaultGrams: 120, name: "Banana", nameAr: "موز" },
  { keys: ["apple", "تفاح"], per100: { p: 0.3, c: 14, f: 0.2, b: 2.4, k: 52 }, defaultGrams: 150, name: "Apple", nameAr: "تفاح" },
  { keys: ["date", "تمر", "بلح"], per100: { p: 2.5, c: 75, f: 0.4, b: 8, k: 282 }, defaultGrams: 50, name: "Dates", nameAr: "تمر" },
  { keys: ["peanut", "فول سوداني", "زبدة فول"], per100: { p: 25, c: 20, f: 50, b: 6, k: 588 }, defaultGrams: 20, name: "Peanut butter", nameAr: "زبدة فول سوداني" },
  { keys: ["olive oil", "زيت زيتون"], per100: { p: 0, c: 0, f: 100, b: 0, k: 884 }, defaultGrams: 10, name: "Olive oil", nameAr: "زيت زيتون" },
  { keys: ["hummus", "حمص"], per100: { p: 8, c: 14, f: 10, b: 6, k: 166 }, defaultGrams: 100, name: "Hummus", nameAr: "حمص" },
  { keys: ["falafel", "فلافل", "طعمية"], per100: { p: 13, c: 32, f: 18, b: 5, k: 333 }, defaultGrams: 80, name: "Falafel", nameAr: "طعمية" },
  { keys: ["ful", "فول"], per100: { p: 8, c: 20, f: 0.7, b: 8, k: 110 }, defaultGrams: 200, name: "Fava beans", nameAr: "فول مدمس" },
  { keys: ["koshari", "كشري", "koshary"], per100: { p: 5, c: 28, f: 4, b: 3, k: 164 }, defaultGrams: 400, name: "Koshari", nameAr: "كشري" },
  { keys: ["salad", "سلطة"], per100: { p: 1.2, c: 4, f: 0.2, b: 1.8, k: 20 }, defaultGrams: 150, name: "Salad", nameAr: "سلطة" },
  { keys: ["cucumber", "خيار"], per100: { p: 0.7, c: 3.6, f: 0.1, b: 0.5, k: 16 }, defaultGrams: 100, name: "Cucumber", nameAr: "خيار" },
  { keys: ["tomato", "طماطم"], per100: { p: 0.9, c: 3.9, f: 0.2, b: 1.2, k: 18 }, defaultGrams: 100, name: "Tomato", nameAr: "طماطم" },
  { keys: ["salmon", "سلمون"], per100: { p: 20, c: 0, f: 13, b: 0, k: 208 }, defaultGrams: 150, name: "Salmon", nameAr: "سلمون" },
  { keys: ["beef", "لحم", "لحمة"], per100: { p: 26, c: 0, f: 15, b: 0, k: 250 }, defaultGrams: 150, name: "Beef", nameAr: "لحم" },
  { keys: ["pasta", "مكرونة"], per100: { p: 5, c: 31, f: 1.1, b: 1.8, k: 157 }, defaultGrams: 180, name: "Pasta", nameAr: "مكرونة" },
  { keys: ["lentil", "عدس"], per100: { p: 9, c: 20, f: 0.4, b: 8, k: 116 }, defaultGrams: 150, name: "Lentils", nameAr: "عدس" },
  { keys: ["protein", "واي", "whey"], per100: { p: 75, c: 8, f: 5, b: 0, k: 380 }, defaultGrams: 30, name: "Whey", nameAr: "واي بروتين" },
  { keys: ["nuts", "مكسرات"], per100: { p: 15, c: 21, f: 49, b: 7, k: 560 }, defaultGrams: 30, name: "Mixed nuts", nameAr: "مكسرات" },
  { keys: ["oats smoothie", "سموثي"], per100: { p: 8, c: 22, f: 8, b: 3, k: 190 }, defaultGrams: 300, name: "Oat smoothie", nameAr: "سموثي شوفان" },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه");
}

function scale(m: Macros, grams: number): Macros {
  const s = grams / 100;
  const r = (n: number) => Math.round(n * 10) / 10;
  return { p: r(m.p * s), c: r(m.c * s), f: r(m.f * s), b: r(m.b * s), k: r(m.k * s) };
}

export interface MatchedFood {
  name: string;
  nameAr: string;
  grams: number;
  macro: Macros;
}

export function matchFoods(text: string): { items: MatchedFood[]; macro: Macros; matched: boolean } {
  const n = norm(text);
  const items: MatchedFood[] = [];
  let macro = { ...EMPTY_MACROS };
  for (const food of FOODS) {
    if (food.keys.some((k) => n.includes(norm(k)))) {
      const gramsMatch = n.match(new RegExp(`(\\d{1,4})\\s*(g|جم|غ)?[^\\d]{0,6}${norm(food.keys[0])}`, "i"));
      const grams = gramsMatch ? Number(gramsMatch[1]) : food.defaultGrams;
      const m = scale(food.per100, grams);
      items.push({ name: food.name, nameAr: food.nameAr, grams, macro: m });
      macro = addMacros(macro, m);
    }
  }
  return { items, macro, matched: items.length > 0 };
}
