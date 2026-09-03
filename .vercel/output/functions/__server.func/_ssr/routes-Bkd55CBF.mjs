import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogPortal, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { C as Briefcase, S as CodeXml, T as Apple, _ as History, b as Dumbbell, c as Star, d as Send, f as Plus, g as Inbox, h as MessageSquare, i as Trophy, l as Sparkles, m as MoonStar, n as Waves, o as Trash2, p as Moon, r as Utensils, s as Sunrise, t as X, u as Settings, v as HeartPulse, w as BookOpen, x as Coffee, y as Flame } from "../_libs/lucide-react.mjs";
import { a as signOut, n as authClient, r as cn, t as Button } from "./client-B1YODyJQ.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/@radix-ui/react-switch+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bkd55CBF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var askAssistant = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("b7c89a262ff9eb6a8c65f1aa56f14729de78e36a170cd32fb5e570c9fb2f207c"));
var PRAYER_KEYS = [
	"Fajr",
	"Dhuhr",
	"Asr",
	"Maghrib",
	"Isha"
];
var PRAYER_META = [
	{
		key: "Fajr",
		ar: "الفجر",
		en: "Fajr",
		points: 10,
		sunnahAr: "سنة الفجر (ركعتان قبل)",
		sunnahEn: "Fajr sunnah (2 before)"
	},
	{
		key: "Dhuhr",
		ar: "الظهر",
		en: "Dhuhr",
		points: 10,
		sunnahAr: "سنة الظهر (٤ قبل + ٢ بعد)",
		sunnahEn: "Dhuhr sunnah (4 before + 2 after)"
	},
	{
		key: "Asr",
		ar: "العصر",
		en: "Asr",
		points: 10,
		sunnahAr: null,
		sunnahEn: null
	},
	{
		key: "Maghrib",
		ar: "المغرب",
		en: "Maghrib",
		points: 10,
		sunnahAr: "سنة المغرب (ركعتان بعد)",
		sunnahEn: "Maghrib sunnah (2 after)"
	},
	{
		key: "Isha",
		ar: "العشاء",
		en: "Isha",
		points: 10,
		sunnahAr: "سنة العشاء (ركعتان بعد)",
		sunnahEn: "Isha sunnah (2 after)"
	}
];
var FALLBACK_PRAYER_TIMES = {
	Fajr: "03:13",
	Sunrise: "04:50",
	Dhuhr: "11:51",
	Asr: "15:25",
	Maghrib: "18:51",
	Isha: "20:26"
};
var DAY_NAMES = {
	en: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	],
	ar: [
		"الأحد",
		"الاثنين",
		"الثلاثاء",
		"الأربعاء",
		"الخميس",
		"الجمعة",
		"السبت"
	]
};
function emptyWeek() {
	const week = {};
	for (let i = 0; i < 7; i++) week[i] = {
		name: DAY_NAMES.en[i],
		nameAr: DAY_NAMES.ar[i],
		wake: "07:00",
		bed: "23:00",
		gym: null,
		tasks: []
	};
	return week;
}
var REST_MEALS = {
	breakfast: {
		p: 31,
		c: 41,
		f: 19,
		b: 5,
		k: 465
	},
	lunch: {
		p: 45,
		c: 45,
		f: 15,
		b: 6,
		k: 500
	},
	dinner: {
		p: 27,
		c: 23,
		f: 16,
		b: 5,
		k: 350
	},
	snack: {
		p: 5,
		c: 25,
		f: 10,
		b: 4,
		k: 200
	}
};
var GYM_MEALS = {
	breakfast: {
		p: 26,
		c: 75,
		f: 17,
		b: 8,
		k: 560
	},
	lunch: {
		p: 45,
		c: 40,
		f: 15,
		b: 6,
		k: 480
	},
	dinner: {
		p: 33,
		c: 28,
		f: 17,
		b: 5,
		k: 400
	},
	pre: {
		p: 21,
		c: 67,
		f: 24,
		b: 5,
		k: 570
	}
};
function task(partial) {
	return {
		notify: true,
		nameAr: partial.nameAr ?? partial.name,
		descAr: partial.descAr ?? partial.desc,
		...partial
	};
}
function meal(id, start, end, names, descs, macros, mealKey, optional = false) {
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
		targetMacros: macros
	});
}
function deepWork(id, start, end, label, pts = 30) {
	return task({
		id,
		start,
		end,
		category: "prog",
		name: label[0],
		nameAr: label[1],
		desc: "Uninterrupted block. Phone down, one outcome.",
		descAr: "بلوك بدون مقاطعة. تليفون بعيد، هدف واحد.",
		pts
	});
}
function admin(id, start, end) {
	return task({
		id,
		start,
		end,
		category: "admin",
		name: "Admin sweep",
		nameAr: "مهام إدارية",
		desc: "Mail, quick replies, light coordination.",
		descAr: "إيميلات، ردود سريعة، تنسيق خفيف.",
		pts: 10
	});
}
function gym(id, start, end, kind) {
	return task({
		id,
		start,
		end,
		category: "gym",
		name: kind === "upper" ? "Gym — upper" : "Gym — lower",
		nameAr: kind === "upper" ? "جيم — علوي" : "جيم — سفلي",
		desc: kind === "upper" ? "Press, pull, arms. 20 min walk after." : "Squat pattern, hinge, calves. 20 min walk after.",
		descAr: kind === "upper" ? "ضغط وسحب وذراعين. مشي ٢٠ دقيقة بعد." : "سكوات وديدلفت وسمانة. مشي ٢٠ دقيقة بعد.",
		pts: 25
	});
}
function quran(id, start, end) {
	return task({
		id,
		start,
		end,
		category: "quran",
		name: "Daily wird",
		nameAr: "الورد اليومي",
		desc: "Fifteen quiet minutes.",
		descAr: "ربع ساعة بهدوء.",
		pts: 10
	});
}
function sleep(id, start) {
	return task({
		id,
		start,
		end: addHours(start, .5),
		category: "sleep",
		name: "Lights out",
		nameAr: "نوم على الوقت",
		desc: "Same bedtime. Protect tomorrow's peak.",
		descAr: "نفس المعاد. احمِ تركيز بكرة.",
		pts: 10
	});
}
function free(id, start, end) {
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
		optional: true
	});
}
function addHours(hhmm, hours) {
	const [h, m] = hhmm.split(":").map(Number);
	const wrapped = ((h * 60 + m + Math.round(hours * 60)) % 1440 + 1440) % 1440;
	return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}
function bufferAfter(end, minutes = 15) {
	return addHours(end, minutes / 60);
}
function sortTasks(tasks) {
	return [...tasks].sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
}
function buildFocusWeek(opts) {
	const week = emptyWeek();
	const peakStart = opts.peakStart || "08:00";
	const peakEnd = opts.peakEnd || "11:00";
	const mid = addHours(peakStart, 1.5);
	const afterPeak = bufferAfter(peakEnd, 10);
	const logoff = opts.logoff || "17:30";
	const gymMap = {
		0: null,
		1: "lower",
		2: null,
		3: "upper",
		4: null,
		5: null,
		6: "upper"
	};
	for (let jd = 0; jd < 7; jd++) {
		const isGym = Boolean(gymMap[jd]);
		const meals = isGym ? GYM_MEALS : REST_MEALS;
		const friday = jd === 5;
		const tasks = [];
		tasks.push(meal(`${jd}-bk`, addHours(peakStart, -.75), addHours(peakStart, -.15), ["Breakfast", "الفطار"], isGym ? ["Fava beans, olive oil, brown loaf, cucumber.", "فول، زيت زيتون، رغيف أسمر، خيار."] : ["Cottage cheese, brown toast, milk, cucumber.", "جبنة قريش، توست أسمر، لبن، خيار."], meals.breakfast, `${isGym ? "gym" : "rest"}:breakfast`));
		tasks.push(quran(`${jd}-wd`, addHours(peakStart, -.15), peakStart));
		if (!friday) {
			tasks.push(deepWork(`${jd}-dw1`, peakStart, mid, ["Deep work I", "شغل عميق ١"]));
			tasks.push(deepWork(`${jd}-dw2`, bufferAfter(mid, 10), peakEnd, ["Deep work II", "شغل عميق ٢"]));
		} else tasks.push(deepWork(`${jd}-dw1`, peakStart, addHours(peakStart, 2), ["Quiet review", "مراجعة هادية"], 20));
		tasks.push(meal(`${jd}-sn1`, afterPeak, addHours(afterPeak, .25), ["Mid-morning snack", "سناك منتصف النهار"], ["A handful of nuts and a piece of fruit.", "حفنة مكسرات وثمرة فاكهة."], REST_MEALS.snack, `${isGym ? "gym" : "rest"}:middaySnack`, true));
		if (!friday) tasks.push(admin(`${jd}-ad`, addHours(afterPeak, .3), addHours(afterPeak, 1.1)));
		const lunchStart = friday ? "13:30" : "12:30";
		tasks.push(meal(`${jd}-lu`, lunchStart, addHours(lunchStart, .75), ["Lunch", "الغدا"], ["Protein, a measured carb, large salad.", "بروتين، كارب محسوب، سلطة كبيرة."], meals.lunch, `${isGym ? "gym" : "rest"}:lunch`));
		if (jd === 1 || jd === 4) tasks.push(deepWork(`${jd}-ss`, "12:00", "13:00", ["Craft session", "سيشن صنعة"], 15));
		tasks.push(admin(`${jd}-ad2`, addHours(lunchStart, 1), addHours(lunchStart, 1.75)));
		if (isGym) {
			const gymStart = jd === 6 ? "15:00" : "17:00";
			tasks.push(meal(`${jd}-ps`, addHours(gymStart, -1), addHours(gymStart, -.25), ["Pre-gym snack", "سناك قبل الجيم"], ["Oats, milk, banana, peanut butter.", "شوفان، لبن، موز، زبدة فول سوداني."], GYM_MEALS.pre, "gym:preGymSnack"));
			tasks.push(gym(`${jd}-gm`, gymStart, addHours(gymStart, 1.25), gymMap[jd]));
			tasks.push(meal(`${jd}-pm`, addHours(gymStart, 1.5), addHours(gymStart, 2.1), ["Post-training meal", "وجبة بعد التمرين"], ["Eggs, cucumber, tomato.", "بيض، خيار، طماطم."], GYM_MEALS.dinner, "gym:dinner"));
		} else {
			tasks.push(free(`${jd}-fr`, logoff, addHours(logoff, 1.5)));
			tasks.push(meal(`${jd}-dn`, "20:00", "20:40", ["Dinner", "العشا"], ["Cottage cheese, half a brown loaf, vegetables.", "جبنة قريش، نصف رغيف أسمر، خضار."], REST_MEALS.dinner, "rest:dinner"));
		}
		tasks.push(meal(`${jd}-sn3`, "21:30", "21:50", ["Evening snack", "سناك مسائي"], ["Fruit or a few nuts if hungry.", "فاكهة أو مكسرات لو جعت."], REST_MEALS.snack, `${isGym ? "gym" : "rest"}:bedtimeSnack`, true));
		const bed = isGym ? "00:00" : "23:00";
		tasks.push(sleep(`${jd}-sl`, bed));
		week[jd].wake = addHours(peakStart, -1);
		week[jd].bed = bed;
		week[jd].gym = gymMap[jd];
		week[jd].tasks = sortTasks(tasks);
	}
	return week;
}
function applyBuiltDays(base, built) {
	const next = JSON.parse(JSON.stringify(base));
	for (const key of Object.keys(built)) {
		const jd = Number(key);
		if (!next[jd]) continue;
		const tasks = built[jd];
		if (tasks) next[jd].tasks = sortTasks(tasks);
	}
	return next;
}
var TZ = "Asia/Kuwait";
var WEEKDAY_TO_JD = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6
};
function kuwaitParts(date = /* @__PURE__ */ new Date()) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).formatToParts(date);
	const o = {};
	for (const p of parts) if (p.type !== "literal") o[p.type] = p.value;
	return o;
}
function todayISO(date = /* @__PURE__ */ new Date()) {
	const p = kuwaitParts(date);
	return `${p.year}-${p.month}-${p.day}`;
}
function todayJD(date = /* @__PURE__ */ new Date()) {
	return WEEKDAY_TO_JD[kuwaitParts(date).weekday] ?? 0;
}
function kuwaitNowMinutes(date = /* @__PURE__ */ new Date()) {
	const p = kuwaitParts(date);
	const hh = Number.parseInt(p.hour === "24" ? "0" : p.hour, 10);
	const mm = Number.parseInt(p.minute, 10);
	return hh * 60 + mm;
}
function pad2(n) {
	return String(n).padStart(2, "0");
}
function cleanTime(raw) {
	if (!raw) return "";
	const m = String(raw).match(/\d{1,2}:\d{2}/);
	return m ? m[0] : String(raw);
}
/** Parse "9:15 ص", "21:00", or "9:15 م" into minutes since midnight. */
function toMinutes(raw) {
	if (!raw) return 0;
	const [hStr, mStr] = cleanTime(raw).split(":");
	const h = Number(hStr);
	const m = Number(mStr) || 0;
	const text = String(raw);
	if (text.includes("ص") || text.includes("م")) {
		const pm = text.includes("م");
		let hr = h;
		if (pm && h !== 12) hr += 12;
		if (!pm && h === 12) hr = 0;
		return hr * 60 + m;
	}
	return h * 60 + m;
}
function formatArabicTime(raw) {
	const s = cleanTime(raw);
	if (!s) return "";
	const [hStr, mStr] = s.split(":");
	let h = Number(hStr);
	const m = Number(mStr) || 0;
	const text = String(raw ?? "");
	if (text.includes("ص") || text.includes("م")) return `${h}:${pad2(m)} ${text.includes("م") ? "م" : "ص"}`;
	const pm = h >= 12;
	return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${pad2(m)} ${pm ? "م" : "ص"}`;
}
function formatEnglishTime(raw) {
	const mins = toMinutes(raw);
	const h24 = Math.floor(mins / 60);
	const m = mins % 60;
	const pm = h24 >= 12;
	return `${h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24}:${pad2(m)} ${pm ? "PM" : "AM"}`;
}
function addDaysISO(iso, days) {
	const [y, mo, d] = iso.split("-").map(Number);
	const dt = new Date(Date.UTC(y, mo - 1, d + days));
	return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}
/** Saturday-start week (Gulf). Returns YYYY-MM-DD of that week's Saturday. */
function weekStartSaturday(iso) {
	const [y, mo, d] = iso.split("-").map(Number);
	return addDaysISO(iso, -((new Date(Date.UTC(y, mo - 1, d)).getUTCDay() + 1) % 7));
}
function dateForWeekday(jd, refISO) {
	return addDaysISO(weekStartSaturday(refISO), (jd + 1) % 7);
}
function jdFromISO(iso) {
	const [y, mo, d] = iso.split("-").map(Number);
	return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}
function taskEndMinutes(task) {
	if (task.end) return toMinutes(task.end);
	return toMinutes(task.start) + 30;
}
function isCurrentTask(task, nowMins = kuwaitNowMinutes()) {
	const start = toMinutes(task.start);
	const end = taskEndMinutes(task);
	if (end < start) return nowMins >= start || nowMins < end;
	return nowMins >= start && nowMins < end;
}
function currentTaskId(tasks, nowMins = kuwaitNowMinutes()) {
	return tasks.find((t) => isCurrentTask(t, nowMins))?.id ?? null;
}
function requiredTasks(tasks) {
	return tasks.filter((t) => !t.optional && t.category !== "sunrise");
}
function completionKind(task, nowMins = kuwaitNowMinutes()) {
	const end = taskEndMinutes(task);
	const start = toMinutes(task.start);
	if (nowMins <= end + 15) return "ontime";
	if (nowMins <= start + 1440) return "late";
	return "qada";
}
function dayProgress(tasks, done) {
	const req = requiredTasks(tasks);
	const completed = req.filter((t) => done[t.id]);
	const pts = Object.values(done).reduce((s, d) => s + (d.pts || 0), 0);
	return {
		done: completed.length,
		total: req.length,
		pts
	};
}
function upsertTask(week, jd, task) {
	const next = JSON.parse(JSON.stringify(week));
	const day = next[jd];
	if (!day) return week;
	const idx = day.tasks.findIndex((t) => t.id === task.id);
	if (idx >= 0) day.tasks[idx] = task;
	else day.tasks.push(task);
	day.tasks = sortTasks(day.tasks);
	return next;
}
function removeTask(week, jd, taskId) {
	const next = JSON.parse(JSON.stringify(week));
	const day = next[jd];
	if (!day) return week;
	day.tasks = day.tasks.filter((t) => t.id !== taskId);
	return next;
}
function withPrayerTasks(tasks, times, track) {
	if (!track) return tasks.filter((t) => t.category !== "prayer");
	const existing = new Set(tasks.filter((t) => t.category === "prayer").map((t) => t.id));
	const injected = [];
	for (const meta of PRAYER_META) {
		const id = `prayer-${meta.key}`;
		if (existing.has(id) || existing.has(meta.key)) continue;
		const start = times[meta.key];
		if (!start) continue;
		injected.push({
			id,
			start,
			end: addMinutes(start, 20),
			category: "prayer",
			name: meta.en,
			nameAr: meta.ar,
			desc: meta.sunnahEn ?? "",
			descAr: meta.sunnahAr ?? "",
			pts: meta.points,
			notify: true
		});
	}
	return sortTasks([...tasks.filter((t) => t.category !== "prayer"), ...injected]);
}
function addMinutes(hhmm, minutes) {
	const wrapped = ((toMinutes(hhmm) + minutes) % 1440 + 1440) % 1440;
	const h = Math.floor(wrapped / 60);
	const m = wrapped % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function newTaskId() {
	return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
function upsertDayLog(history, date, done) {
	const prev = history[date];
	return {
		...history,
		[date]: {
			done,
			penalty: prev?.penalty ?? null
		}
	};
}
function buildWeeklyReport(week, history, weekStart, pts) {
	let daysCompleted = 0;
	let tasksDone = 0;
	let tasksMissed = 0;
	for (let i = 0; i < 7; i++) {
		const date = addDaysISO(weekStart, i);
		const req = requiredTasks(week[jdFromISO(date)]?.tasks ?? []);
		const done = history[date]?.done ?? {};
		const completed = req.filter((t) => done[t.id]).length;
		tasksDone += completed;
		tasksMissed += req.length - completed;
		if (req.length > 0 && completed === req.length) daysCompleted += 1;
	}
	return {
		weekStart,
		totalPts: pts,
		daysCompleted,
		tasksDone,
		tasksMissed,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function lastNDays(history, week, today, n = 14) {
	const out = [];
	for (let i = 0; i < n; i++) {
		const date = addDaysISO(today, -i);
		const jd = jdFromISO(date);
		const tasks = week[jd]?.tasks ?? [];
		const req = requiredTasks(tasks);
		const doneMap = history[date]?.done ?? {};
		out.push({
			date,
			jd,
			done: req.filter((t) => doneMap[t.id]).length,
			total: req.length,
			tasks
		});
	}
	return out;
}
var estimateMacrosRemote = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("ac35c86094b78c325ae9ea358e8289742ee13c75ff235d92f3960edeaaa908f7"));
var EMPTY_MACROS = {
	p: 0,
	c: 0,
	f: 0,
	b: 0,
	k: 0
};
function addMacros(a, b) {
	return {
		p: a.p + b.p,
		c: a.c + b.c,
		f: a.f + b.f,
		b: a.b + b.b,
		k: a.k + b.k
	};
}
function scaleMacros(m, factor) {
	return {
		p: m.p * factor,
		c: m.c * factor,
		f: m.f * factor,
		b: m.b * factor,
		k: m.k * factor
	};
}
function roundMacros(m) {
	const r1 = (n) => Math.round(n * 10) / 10;
	return {
		p: r1(m.p),
		c: r1(m.c),
		f: r1(m.f),
		b: r1(m.b),
		k: r1(m.k)
	};
}
/** Per-100g baselines for common kitchen foods (Arabic + English keys). */
var FOOD_DB = [
	{
		keys: [
			"chicken",
			"صدر",
			"دجاج"
		],
		per100: {
			p: 31,
			c: 0,
			f: 3.6,
			b: 0,
			k: 165
		}
	},
	{
		keys: [
			"rice",
			"رز",
			"أرز"
		],
		per100: {
			p: 2.7,
			c: 28,
			f: .3,
			b: .4,
			k: 130
		}
	},
	{
		keys: [
			"bread",
			"عيش",
			"توست",
			"رغيف"
		],
		per100: {
			p: 9,
			c: 49,
			f: 3.2,
			b: 7,
			k: 265
		}
	},
	{
		keys: ["egg", "بيض"],
		per100: {
			p: 13,
			c: 1.1,
			f: 11,
			b: 0,
			k: 155
		}
	},
	{
		keys: ["cottage", "قريش"],
		per100: {
			p: 11,
			c: 3.4,
			f: 4.3,
			b: 0,
			k: 98
		}
	},
	{
		keys: ["fava", "فول"],
		per100: {
			p: 8,
			c: 19,
			f: .7,
			b: 5,
			k: 110
		}
	},
	{
		keys: ["oat", "شوفان"],
		per100: {
			p: 13,
			c: 67,
			f: 7,
			b: 10,
			k: 389
		}
	},
	{
		keys: ["banana", "موز"],
		per100: {
			p: 1.1,
			c: 23,
			f: .3,
			b: 2.6,
			k: 89
		}
	},
	{
		keys: [
			"peanut",
			"فول سوداني",
			"زبدة"
		],
		per100: {
			p: 25,
			c: 20,
			f: 50,
			b: 6,
			k: 588
		}
	},
	{
		keys: ["cucumber", "خيار"],
		per100: {
			p: .7,
			c: 3.6,
			f: .1,
			b: .5,
			k: 16
		}
	},
	{
		keys: ["tomato", "طماطم"],
		per100: {
			p: .9,
			c: 3.9,
			f: .2,
			b: 1.2,
			k: 18
		}
	},
	{
		keys: [
			"milk",
			"لبن",
			"حليب"
		],
		per100: {
			p: 3.4,
			c: 5,
			f: 3.3,
			b: 0,
			k: 61
		}
	},
	{
		keys: [
			"nuts",
			"مكسرات",
			"لوز"
		],
		per100: {
			p: 21,
			c: 22,
			f: 49,
			b: 12,
			k: 607
		}
	},
	{
		keys: [
			"apple",
			"تفاح",
			"فاكهة"
		],
		per100: {
			p: .3,
			c: 14,
			f: .2,
			b: 2.4,
			k: 52
		}
	},
	{
		keys: ["olive", "زيتون"],
		per100: {
			p: 0,
			c: 0,
			f: 100,
			b: 0,
			k: 884
		}
	},
	{
		keys: ["salad", "سلطة"],
		per100: {
			p: 1.2,
			c: 4,
			f: .2,
			b: 1.8,
			k: 20
		}
	},
	{
		keys: ["yogurt", "زبادي"],
		per100: {
			p: 10,
			c: 3.6,
			f: .4,
			b: 0,
			k: 59
		}
	},
	{
		keys: ["tuna", "تونة"],
		per100: {
			p: 26,
			c: 0,
			f: 1,
			b: 0,
			k: 116
		}
	},
	{
		keys: ["potato", "بطاطس"],
		per100: {
			p: 2,
			c: 17,
			f: .1,
			b: 2.2,
			k: 77
		}
	},
	{
		keys: ["dates", "تمر"],
		per100: {
			p: 2.5,
			c: 75,
			f: .4,
			b: 8,
			k: 282
		}
	}
];
function parseGrams(text) {
	const m = text.match(/(\d+(?:\.\d+)?)\s*(g|جم|غرام|grams?)?/i);
	if (!m) return null;
	const n = Number(m[1]);
	if (!Number.isFinite(n) || n <= 0) return null;
	if (n > 20 && n < 1500) return n;
	return null;
}
function estimateFromLocalDb(text) {
	const lower = text.toLowerCase();
	let macro = { ...EMPTY_MACROS };
	const items = [];
	for (const row of FOOD_DB) {
		if (!row.keys.some((k) => lower.includes(k.toLowerCase()))) continue;
		const grams = parseGrams(text) ?? 120;
		const scaled = scaleMacros(row.per100, grams / 100);
		macro = addMacros(macro, scaled);
		items.push({
			name: row.keys[0],
			grams
		});
	}
	return {
		macro: roundMacros(macro),
		items,
		matched: items.length > 0
	};
}
function plannedEntry(task, at) {
	if (!task.targetMacros) return null;
	return {
		mealKey: task.mealKey ?? task.id,
		taskId: task.id,
		items: [{
			name: task.name,
			kcal: task.targetMacros.k
		}],
		macro: task.targetMacros,
		source: "planned",
		at
	};
}
function dayMacros(logs) {
	if (!logs) return { ...EMPTY_MACROS };
	return roundMacros(Object.values(logs).reduce((acc, e) => addMacros(acc, e.macro), { ...EMPTY_MACROS }));
}
function upsertFoodLog(all, date, entry) {
	const day = {
		...all[date] || {},
		[entry.taskId]: entry
	};
	return {
		...all,
		[date]: day
	};
}
function pct(value, target) {
	if (!target) return 0;
	return Math.min(100, Math.round(value / target * 100));
}
var DEFAULT_SETTINGS = {
	lang: "ar",
	trackPrayers: true,
	showTracking: true,
	displayName: "",
	workspaceName: "",
	buildMode: "template",
	onboardingComplete: true,
	notifEnabled: false,
	city: "Kuwait",
	country: "Kuwait",
	kcalTarget: 2200,
	proteinTarget: 160,
	carbsTarget: 220,
	fatTarget: 70,
	fiberTarget: 30,
	peakStart: "08:00",
	peakEnd: "11:00",
	logoff: "17:30"
};
function applyOnboarding(answers) {
	const settings = {
		...DEFAULT_SETTINGS,
		displayName: answers.name.trim(),
		trackPrayers: answers.trackPrayers,
		peakStart: answers.peakStart,
		peakEnd: answers.peakEnd,
		logoff: answers.logoff,
		buildMode: answers.buildMode,
		workspaceName: answers.workspaceName.trim() || (answers.name ? `${answers.name}` : ""),
		onboardingComplete: true
	};
	return {
		schedule: answers.buildMode === "custom" ? emptyWeek() : buildFocusWeek({
			peakStart: answers.peakStart,
			peakEnd: answers.peakEnd,
			logoff: answers.logoff,
			trackPrayers: answers.trackPrayers
		}),
		settings
	};
}
/** Local-first build: cloud sync is unused. Stubs keep the module importable. */
var loadCloudState = createServerFn({ method: "GET" }).handler(createSsrRpc("8ef62e073bda174789125045dbc00f498671ae5cc97608941293ca9cf574ba40"));
var saveCloudState = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("23bcb4f15984493305fd850cc2968a4622816dd10d9f37268f46fedac3fb776d"));
var STORAGE_KEY = "smart-schedule.v1";
var EMPTY_STATS = {
	pts: 0,
	cur: 0,
	best: 0,
	lastComplete: null,
	lastFail: null,
	lastPtsWeekStart: null
};
var LATE_MULTIPLIER = .5;
var QADA_MULTIPLIER = .25;
function emptyPersisted() {
	return {
		schedule: buildFocusWeek({
			peakStart: DEFAULT_SETTINGS.peakStart,
			peakEnd: DEFAULT_SETTINGS.peakEnd,
			logoff: DEFAULT_SETTINGS.logoff,
			trackPrayers: DEFAULT_SETTINGS.trackPrayers
		}),
		settings: { ...DEFAULT_SETTINGS },
		stats: { ...EMPTY_STATS },
		history: {},
		foodLogs: {},
		prayerLogs: {},
		reports: [],
		savedMeals: [],
		chat: null
	};
}
function loadLocal() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const base = emptyPersisted();
		return {
			...base,
			...parsed,
			settings: {
				...base.settings,
				...parsed.settings || {}
			},
			stats: {
				...base.stats,
				...parsed.stats || {}
			},
			schedule: parsed.schedule && Object.keys(parsed.schedule).length ? parsed.schedule : base.schedule
		};
	} catch {
		return null;
	}
}
function saveLocal(state) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {}
}
function resetWeeklyPointsIfNewWeek(stats, today = todayISO()) {
	const start = weekStartSaturday(today);
	if (stats.lastPtsWeekStart === start) return stats;
	return {
		...stats,
		pts: 0,
		lastPtsWeekStart: start
	};
}
function applyMissedPenalty(yesterdayTasks, yesterdayDone, stats, alreadyPenalized, yesterdayISO) {
	if (alreadyPenalized) return {
		stats,
		penalty: null
	};
	const missed = requiredTasks(yesterdayTasks).filter((t) => !yesterdayDone[t.id]).length;
	if (missed === 0) return {
		stats,
		penalty: null
	};
	const deducted = missed * 5;
	return {
		stats: {
			...stats,
			pts: Math.max(0, stats.pts - deducted)
		},
		penalty: {
			date: yesterdayISO,
			missed,
			deducted
		}
	};
}
function applyStreak(todayTasks, todayDone, stats, today = todayISO()) {
	const req = requiredTasks(todayTasks);
	if (req.length === 0) return stats;
	if (!req.every((t) => todayDone[t.id])) {
		if (stats.lastComplete === today) return stats;
		if (stats.lastFail === today) return stats;
		return {
			...stats,
			cur: 0,
			lastFail: today
		};
	}
	if (stats.lastComplete === today) return stats;
	const yesterday = addDaysISO(today, -1);
	const cur = stats.lastComplete === yesterday ? stats.cur + 1 : 1;
	return {
		...stats,
		cur,
		best: Math.max(stats.best, cur),
		lastComplete: today
	};
}
function mergeStats(local, cloud) {
	if (!cloud) return local;
	const later = (a, b) => {
		if (!a) return b;
		if (!b) return a;
		return a > b ? a : b;
	};
	return {
		pts: Math.max(local.pts || 0, cloud.pts || 0),
		cur: Math.max(local.cur || 0, cloud.cur || 0),
		best: Math.max(local.best || 0, cloud.best || 0),
		lastComplete: later(local.lastComplete, cloud.lastComplete),
		lastFail: later(local.lastFail, cloud.lastFail),
		lastPtsWeekStart: later(local.lastPtsWeekStart, cloud.lastPtsWeekStart)
	};
}
function mergeHistory(local, cloud) {
	if (!cloud) return local;
	const out = { ...local };
	for (const [date, day] of Object.entries(cloud)) {
		const existing = out[date];
		if (!existing) {
			out[date] = day;
			continue;
		}
		out[date] = {
			done: {
				...existing.done || {},
				...day.done || {}
			},
			penalty: day.penalty || existing.penalty || null
		};
	}
	return out;
}
var cache = /* @__PURE__ */ new Map();
async function fetchPrayerTimes(city = "Kuwait", country = "Kuwait", date = todayISO()) {
	const key = `${city}|${country}|${date}`;
	const hit = cache.get(key);
	if (hit) return hit;
	try {
		const url = `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=9`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`prayer ${res.status}`);
		const timings = (await res.json()).data?.timings;
		if (!timings) throw new Error("no timings");
		const out = { ...FALLBACK_PRAYER_TIMES };
		for (const k of [...PRAYER_KEYS, "Sunrise"]) if (timings[k]) out[k] = cleanTime(timings[k]);
		cache.set(key, out);
		return out;
	} catch {
		cache.set(key, FALLBACK_PRAYER_TIMES);
		return FALLBACK_PRAYER_TIMES;
	}
}
function awardedPoints(task, status) {
	const base = task.pts || 0;
	if (status === "ontime") return base;
	if (status === "late") return Math.round(base * LATE_MULTIPLIER);
	return Math.round(base * QADA_MULTIPLIER);
}
function completeTask(task, done, stats, nowMins = kuwaitNowMinutes()) {
	const status = completionKind(task, nowMins);
	const pts = awardedPoints(task, status);
	const prev = done[task.id];
	const entry = {
		at: todayISO(),
		pts,
		status
	};
	const nextDone = {
		...done,
		[task.id]: entry
	};
	const delta = pts - (prev?.pts ?? 0);
	return {
		done: nextDone,
		stats: {
			...stats,
			pts: Math.max(0, stats.pts + delta)
		},
		entry
	};
}
function uncompleteTask(taskId, done, stats) {
	const prev = done[taskId];
	if (!prev) return {
		done,
		stats
	};
	const next = { ...done };
	delete next[taskId];
	return {
		done: next,
		stats: {
			...stats,
			pts: Math.max(0, stats.pts - prev.pts)
		}
	};
}
function snapshot(s) {
	return {
		schedule: s.schedule,
		settings: s.settings,
		stats: s.stats,
		history: s.history,
		foodLogs: s.foodLogs,
		prayerLogs: s.prayerLogs,
		reports: s.reports,
		savedMeals: s.savedMeals,
		chat: s.chat
	};
}
var cloudTimer = null;
function queueCloud(get) {
	if (!get().signedIn) return;
	if (cloudTimer) clearTimeout(cloudTimer);
	cloudTimer = setTimeout(() => {
		const s = get();
		s.syncing = true;
		saveCloudState({ data: snapshot(s) }).catch(() => void 0).finally(() => {
			useAppStore.setState({ syncing: false });
		});
	}, 900);
}
var useAppStore = create((set, get) => ({
	...emptyPersisted(),
	hydrated: false,
	selectedJd: todayJD(),
	selectedDate: todayISO(),
	prayerTimes: FALLBACK_PRAYER_TIMES,
	syncing: false,
	signedIn: false,
	persist: () => {
		saveLocal(snapshot(get()));
		queueCloud(get);
	},
	hydrate: async (signedIn) => {
		if (get().hydrated && get().signedIn === signedIn) return;
		const local = loadLocal() ?? emptyPersisted();
		let merged = local;
		if (signedIn) try {
			const cloud = await loadCloudState();
			if (cloud) {
				const cloudEmpty = !cloud.schedule || Object.keys(cloud.schedule).length === 0;
				merged = {
					...local,
					...cloud,
					settings: {
						...local.settings,
						...cloud.settings || {}
					},
					stats: mergeStats(local.stats, cloud.stats),
					history: mergeHistory(local.history, cloud.history),
					foodLogs: {
						...local.foodLogs || {},
						...cloud.foodLogs || {}
					},
					prayerLogs: {
						...local.prayerLogs || {},
						...cloud.prayerLogs || {}
					},
					schedule: cloudEmpty ? local.schedule : cloud.schedule,
					reports: (cloud.reports?.length ? cloud.reports : local.reports) ?? [],
					savedMeals: cloud.savedMeals?.length ? cloud.savedMeals : local.savedMeals,
					chat: cloud.chat ?? local.chat
				};
			}
		} catch {}
		const today = todayISO();
		const jd = todayJD();
		let stats = resetWeeklyPointsIfNewWeek(merged.stats, today);
		const yesterday = addDaysISO(today, -1);
		const yJd = (jd + 6) % 7;
		const yTasks = merged.schedule[yJd]?.tasks ?? [];
		const yDone = merged.history[yesterday]?.done ?? {};
		const already = Boolean(merged.history[yesterday]?.penalty);
		const penalized = applyMissedPenalty(yTasks, yDone, stats, already, yesterday);
		stats = penalized.stats;
		const history = { ...merged.history };
		if (penalized.penalty) history[yesterday] = {
			done: yDone,
			penalty: penalized.penalty
		};
		let times = FALLBACK_PRAYER_TIMES;
		try {
			times = await fetchPrayerTimes(merged.settings.city, merged.settings.country, today);
		} catch {}
		set({
			...merged,
			stats,
			history,
			signedIn,
			selectedJd: jd,
			selectedDate: today,
			prayerTimes: times,
			hydrated: true
		});
		get().persist();
	},
	selectDay: (jd, date) => set({
		selectedJd: jd,
		selectedDate: date
	}),
	complete: (task) => {
		const s = get();
		const date = s.selectedDate;
		const result = completeTask(task, s.history[date]?.done ?? {}, s.stats);
		set({
			history: upsertDayLog(s.history, date, result.done),
			stats: applyStreak(withPrayerTasks(s.schedule[s.selectedJd]?.tasks ?? [], s.prayerTimes, s.settings.trackPrayers), result.done, result.stats, date)
		});
		get().persist();
		return {
			status: result.entry.status,
			pts: result.entry.pts
		};
	},
	uncomplete: (taskId) => {
		const s = get();
		const date = s.selectedDate;
		const result = uncompleteTask(taskId, s.history[date]?.done ?? {}, s.stats);
		set({
			history: upsertDayLog(s.history, date, result.done),
			stats: result.stats
		});
		get().persist();
	},
	saveTask: (jd, task, days) => {
		let week = get().schedule;
		const targets = days && days.length ? days : [jd];
		for (const d of targets) {
			const copy = d === jd ? task : {
				...task,
				id: newTaskId()
			};
			week = upsertTask(week, d, copy);
		}
		set({ schedule: week });
		get().persist();
	},
	deleteTask: (jd, taskId) => {
		set({ schedule: removeTask(get().schedule, jd, taskId) });
		get().persist();
	},
	logFood: (task, entry) => {
		const s = get();
		set({ foodLogs: upsertFoodLog(s.foodLogs, s.selectedDate, {
			...entry,
			taskId: task.id,
			mealKey: task.mealKey ?? task.id
		}) });
		get().complete(task);
	},
	logPlannedFood: (task) => {
		const entry = plannedEntry(task, get().selectedDate);
		if (!entry) {
			get().complete(task);
			return;
		}
		get().logFood(task, entry);
	},
	estimateFood: async (text) => {
		const local = estimateFromLocalDb(text);
		if (local.matched) return {
			ok: true,
			entry: {
				items: local.items.map((i) => ({
					name: i.name,
					qty: i.grams,
					unit: "g",
					kcal: void 0
				})),
				macro: local.macro,
				source: "logged",
				estimated: false
			}
		};
		try {
			const remote = await estimateMacrosRemote({ data: { text } });
			if (!remote.ok) return {
				ok: false,
				error: remote.error
			};
			return {
				ok: true,
				entry: {
					items: [{
						name: remote.name,
						qty: remote.grams,
						unit: "g",
						kcal: remote.macro.k,
						estimated: true
					}],
					macro: remote.macro,
					source: "logged",
					estimated: true
				}
			};
		} catch {
			return {
				ok: false,
				error: "unavailable"
			};
		}
	},
	logPrayer: (taskId, log) => {
		const s = get();
		const day = {
			...s.prayerLogs[s.selectedDate] || {},
			[taskId]: log
		};
		set({ prayerLogs: {
			...s.prayerLogs,
			[s.selectedDate]: day
		} });
		const task = withPrayerTasks(s.schedule[s.selectedJd]?.tasks ?? [], s.prayerTimes, s.settings.trackPrayers).find((t) => t.id === taskId);
		if (task) get().complete(task);
		else get().persist();
	},
	patchSettings: (patch) => {
		set({ settings: {
			...get().settings,
			...patch
		} });
		get().persist();
	},
	finishOnboarding: (answers) => {
		const { schedule, settings } = applyOnboarding(answers);
		set({
			schedule,
			settings,
			selectedJd: todayJD(),
			selectedDate: todayISO()
		});
		get().persist();
	},
	replayOnboarding: () => {
		set({ settings: {
			...get().settings,
			onboardingComplete: false
		} });
		get().persist();
	},
	applyTemplate: () => {
		const s = get();
		set({ schedule: buildFocusWeek({
			peakStart: s.settings.peakStart,
			peakEnd: s.settings.peakEnd,
			logoff: s.settings.logoff,
			trackPrayers: s.settings.trackPrayers
		}) });
		get().persist();
	},
	resetLocal: () => {
		set({
			...emptyPersisted(),
			hydrated: true,
			selectedJd: todayJD(),
			selectedDate: todayISO()
		});
		get().persist();
	},
	sendAssistant: async (text) => {
		const s = get();
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const userMsg = {
			id: newTaskId(),
			role: "user",
			content: text,
			at: now
		};
		const prev = s.chat ?? {
			id: newTaskId(),
			title: text.slice(0, 40),
			messages: [],
			updatedAt: now
		};
		const session = {
			...prev,
			messages: [...prev.messages, userMsg],
			updatedAt: now
		};
		set({ chat: session });
		const day = s.schedule[s.selectedJd];
		const context = JSON.stringify({
			date: s.selectedDate,
			jd: s.selectedJd,
			settings: {
				peakStart: s.settings.peakStart,
				peakEnd: s.settings.peakEnd,
				logoff: s.settings.logoff,
				trackPrayers: s.settings.trackPrayers,
				lang: s.settings.lang
			},
			day
		});
		try {
			const res = await askAssistant({ data: {
				messages: session.messages.map((m) => ({
					role: m.role,
					content: m.content
				})),
				context
			} });
			const reply = res.ok ? res.text : s.settings.lang === "ar" ? "المساعد غير متاح حالياً." : "Assistant is unavailable right now.";
			const assistantMsg = {
				id: newTaskId(),
				role: "assistant",
				content: reply,
				at: (/* @__PURE__ */ new Date()).toISOString()
			};
			const nextSession = {
				...session,
				messages: [...session.messages, assistantMsg],
				updatedAt: assistantMsg.at
			};
			let schedule = s.schedule;
			const fence = reply.match(/```json\s*([\s\S]*?)```/);
			if (fence) try {
				const parsed = JSON.parse(fence[1]);
				if (parsed.action === "patch-day" && typeof parsed.jd === "number" && Array.isArray(parsed.tasks)) {
					const tasks = sortTasks(parsed.tasks.map((t) => ({
						...t,
						notify: t.notify ?? true,
						optional: t.optional ?? false,
						nameAr: t.nameAr || t.name,
						descAr: t.descAr || t.desc || "",
						desc: t.desc || "",
						pts: t.pts || 10,
						id: t.id || newTaskId()
					})));
					schedule = applyBuiltDays(schedule, { [parsed.jd]: tasks });
				}
			} catch {}
			set({
				chat: nextSession,
				schedule
			});
			get().persist();
		} catch {
			const assistantMsg = {
				id: newTaskId(),
				role: "assistant",
				content: s.settings.lang === "ar" ? "المساعد غير متاح حالياً." : "Assistant is unavailable right now.",
				at: (/* @__PURE__ */ new Date()).toISOString()
			};
			set({ chat: {
				...session,
				messages: [...session.messages, assistantMsg]
			} });
		}
	},
	clearChat: () => {
		set({ chat: null });
		get().persist();
	}
}));
function buildReportNow() {
	const s = useAppStore.getState();
	return buildWeeklyReport(s.schedule, s.history, weekStartSaturday(s.selectedDate), s.stats.pts);
}
var dict = {
	appName: {
		ar: "الجدول الذكي",
		en: "Smart Schedule"
	},
	tagline: {
		ar: "احمِ وقت التركيز، وخلّي الباقي واضح.",
		en: "Protect focus. Keep the rest honest."
	},
	streak: {
		ar: "الاستريك",
		en: "Streak"
	},
	points: {
		ar: "النقاط",
		en: "Points"
	},
	best: {
		ar: "أفضل",
		en: "Best"
	},
	today: {
		ar: "اليوم",
		en: "Today"
	},
	progress: {
		ar: "إنجاز اليوم",
		en: "Today's progress"
	},
	macros: {
		ar: "الماكروز",
		en: "Macros"
	},
	protein: {
		ar: "بروتين",
		en: "Protein"
	},
	carbs: {
		ar: "كارب",
		en: "Carbs"
	},
	fat: {
		ar: "دهون",
		en: "Fat"
	},
	fiber: {
		ar: "ألياف",
		en: "Fiber"
	},
	kcal: {
		ar: "سعرة",
		en: "kcal"
	},
	done: {
		ar: "تم",
		en: "Done"
	},
	markDone: {
		ar: "إنجاز",
		en: "Complete"
	},
	undo: {
		ar: "تراجع",
		en: "Undo"
	},
	late: {
		ar: "متأخر",
		en: "Late"
	},
	qada: {
		ar: "قضاء",
		en: "Make-up"
	},
	expired: {
		ar: "فات الوقت",
		en: "Expired"
	},
	optional: {
		ar: "اختياري",
		en: "Optional"
	},
	addTask: {
		ar: "إضافة مهمة",
		en: "Add block"
	},
	editTask: {
		ar: "تعديل المهمة",
		en: "Edit block"
	},
	deleteTask: {
		ar: "حذف",
		en: "Delete"
	},
	save: {
		ar: "حفظ",
		en: "Save"
	},
	cancel: {
		ar: "إلغاء",
		en: "Cancel"
	},
	name: {
		ar: "الاسم",
		en: "Name"
	},
	time: {
		ar: "الوقت",
		en: "Time"
	},
	startTime: {
		ar: "البداية",
		en: "Start"
	},
	endTime: {
		ar: "النهاية",
		en: "End"
	},
	category: {
		ar: "التصنيف",
		en: "Category"
	},
	description: {
		ar: "الوصف",
		en: "Description"
	},
	pts: {
		ar: "نقاط",
		en: "pts"
	},
	settings: {
		ar: "الإعدادات",
		en: "Settings"
	},
	history: {
		ar: "السجل",
		en: "History"
	},
	report: {
		ar: "تقرير الأسبوع",
		en: "Weekly report"
	},
	signIn: {
		ar: "تسجيل الدخول",
		en: "Sign in"
	},
	signOut: {
		ar: "خروج",
		en: "Sign out"
	},
	guest: {
		ar: "ضيف",
		en: "Guest"
	},
	language: {
		ar: "اللغة",
		en: "Language"
	},
	prayers: {
		ar: "الصلوات",
		en: "Prayers"
	},
	trackPrayers: {
		ar: "تتبع مواعيد الصلاة",
		en: "Track prayer times"
	},
	workspace: {
		ar: "اسم الجدول",
		en: "Workspace name"
	},
	displayName: {
		ar: "اسمك",
		en: "Your name"
	},
	wake: {
		ar: "الاستيقاظ",
		en: "Wake"
	},
	sleep: {
		ar: "النوم",
		en: "Sleep"
	},
	gymDay: {
		ar: "يوم جيم",
		en: "Training day"
	},
	restDay: {
		ar: "يوم راحة",
		en: "Rest day"
	},
	assistant: {
		ar: "المساعد",
		en: "Assistant"
	},
	askPlaceholder: {
		ar: "اسأل عن جدولك، سجّل أكلة، أو عدّل مهمة…",
		en: "Ask about your day, log a meal, or edit a block…"
	},
	send: {
		ar: "إرسال",
		en: "Send"
	},
	thinking: {
		ar: "بيفكّر…",
		en: "Thinking…"
	},
	signInForAi: {
		ar: "سجّل دخولك عشان تستخدم المساعد",
		en: "Sign in to use the assistant"
	},
	logFood: {
		ar: "تسجيل الأكل",
		en: "Log food"
	},
	plannedMeal: {
		ar: "الوجبة المخططة",
		en: "Planned meal"
	},
	customMeal: {
		ar: "أكلت حاجة تانية",
		en: "I ate something else"
	},
	foodPlaceholder: {
		ar: "مثلاً: صدور دجاج مشوية ٢٠٠ جم مع رز",
		en: "e.g. 200g grilled chicken with rice"
	},
	estimated: {
		ar: "تقريبي",
		en: "Estimate"
	},
	noMatch: {
		ar: "ما قدرناش نحدد الماكروز",
		en: "Couldn't resolve macros"
	},
	emptyDay: {
		ar: "اليوم فاضي",
		en: "Nothing scheduled"
	},
	emptyDayHint: {
		ar: "أضف أول بلوك في يومك، أو ابدأ من القالب الجاهز.",
		en: "Add your first block, or start from the ready template."
	},
	useTemplate: {
		ar: "استخدم القالب",
		en: "Use template"
	},
	onboardingTitle: {
		ar: "أهلاً بيك في الجدول الذكي",
		en: "Welcome to Smart Schedule"
	},
	onboardingSub: {
		ar: "وقت التركيز يبقى محمي. الأكل والصلاة والإغلاق لهم مكان ثابت.",
		en: "Peak hours stay untouched. Meals, prayer, and shutdown get a real slot."
	},
	onboardingName: {
		ar: "إيه اسمك؟",
		en: "What's your name?"
	},
	onboardingNamePh: {
		ar: "اكتب اسمك هنا",
		en: "Type your name"
	},
	onboardingPrayers: {
		ar: "تحب نتابعلك مواعيد الصلاة؟",
		en: "Track prayer times on your timeline?"
	},
	onboardingPrayersYes: {
		ar: "أيوه، ضيفهم",
		en: "Yes, add them"
	},
	onboardingPrayersYesDesc: {
		ar: "الصلوات الخمس بمواقيتها في الكويت",
		en: "The five prayers, timed for Kuwait"
	},
	onboardingPrayersNo: {
		ar: "لأ، جدول عادي",
		en: "Not now"
	},
	onboardingPrayersNoDesc: {
		ar: "تقدر تفعّلها بعدين من الإعدادات",
		en: "You can turn this on later in settings"
	},
	onboardingPeak: {
		ar: "إمتى ذهنك في أحسن حالاته؟",
		en: "When is your mind sharpest?"
	},
	onboardingLogoff: {
		ar: "وقت الإغلاق",
		en: "Hard log-off"
	},
	onboardingMode: {
		ar: "عايز تبدأ إزاي؟",
		en: "How do you want to start?"
	},
	onboardingTemplate: {
		ar: "ابدأ بجدول جاهز",
		en: "Start from a template"
	},
	onboardingTemplateDesc: {
		ar: "قالب متوازن: أكل، ورد، جيم، شغل عميق",
		en: "A balanced week: meals, reading, training, deep work"
	},
	onboardingCustom: {
		ar: "هبني جدولي من الصفر",
		en: "Build from scratch"
	},
	onboardingCustomDesc: {
		ar: "أيام فاضية تضيف عليها مهامك",
		en: "Empty days you fill yourself"
	},
	onboardingWs: {
		ar: "سمّي جدولك",
		en: "Name your workspace"
	},
	onboardingWsPh: {
		ar: "مثلاً: جدول أحمد اليومي",
		en: "e.g. Ahmed's daily plan"
	},
	next: {
		ar: "التالي",
		en: "Next"
	},
	back: {
		ar: "رجوع",
		en: "Back"
	},
	finish: {
		ar: "إنهاء",
		en: "Finish"
	},
	skip: {
		ar: "تخطي",
		en: "Skip"
	},
	weekReport: {
		ar: "تقرير الأسبوع",
		en: "This week's report"
	},
	missed: {
		ar: "فائت",
		en: "Missed"
	},
	completed: {
		ar: "مكتمل",
		en: "Completed"
	},
	noHistory: {
		ar: "ما فيش سجل لسه",
		en: "No history yet"
	},
	noHistoryHint: {
		ar: "كمّل مهامك اليومية وهيتبني السجل لوحده.",
		en: "Complete today's blocks and history will fill in."
	},
	continueGoogle: {
		ar: "متابعة بـ Google",
		en: "Continue with Google"
	},
	continueX: {
		ar: "متابعة بـ X",
		en: "Continue with X"
	},
	loginLead: {
		ar: "جدولك يسافر معاك على أي جهاز.",
		en: "Your schedule follows you across devices."
	},
	loginGuest: {
		ar: "كمّل كضيف",
		en: "Continue as guest"
	},
	current: {
		ar: "الآن",
		en: "Now"
	},
	upcoming: {
		ar: "جاي",
		en: "Up next"
	},
	allCaught: {
		ar: "اليوم كامل",
		en: "Day complete"
	},
	penalty: {
		ar: "خصم",
		en: "Penalty"
	},
	saved: {
		ar: "تم الحفظ",
		en: "Saved"
	},
	syncing: {
		ar: "جاري المزامنة…",
		en: "Syncing…"
	},
	signedInAs: {
		ar: "مسجّل كـ",
		en: "Signed in as"
	},
	general: {
		ar: "عام",
		en: "General"
	},
	schedule: {
		ar: "الجدول",
		en: "Schedule"
	},
	account: {
		ar: "الحساب",
		en: "Account"
	},
	about: {
		ar: "عن التطبيق",
		en: "About"
	},
	aboutBody: {
		ar: "الجدول الذكي يبني يومك حول الطاقة، الصلاة، التدريب، والأكل — مع نقاط واستريك يخلّوا الالتزام واضح.",
		en: "Smart Schedule builds your day around energy, prayer, training, and food — with points and a streak that make consistency visible."
	},
	close: {
		ar: "إغلاق",
		en: "Close"
	},
	required: {
		ar: "مطلوب",
		en: "Required"
	},
	exception: {
		ar: "استثناء",
		en: "Exception"
	},
	log: {
		ar: "سجّل",
		en: "Log"
	},
	applyPlanned: {
		ar: "استخدم المخطط",
		en: "Use planned macros"
	},
	aiUnavailable: {
		ar: "المساعد غير متاح حالياً",
		en: "Assistant is unavailable right now"
	},
	newChat: {
		ar: "محادثة جديدة",
		en: "New chat"
	},
	notify: {
		ar: "ذكّرني",
		en: "Remind me"
	},
	foodToggle: {
		ar: "تسجيل الأكل عند الإكمال",
		en: "Log food on complete"
	},
	days: {
		ar: "أيام الأسبوع",
		en: "Days"
	},
	upper: {
		ar: "علوي",
		en: "Upper"
	},
	lower: {
		ar: "سفلي",
		en: "Lower"
	},
	nutrition: {
		ar: "التغذية اليومية",
		en: "Daily nutrition"
	},
	ptsToday: {
		ar: "نقطة اليوم",
		en: "pts today"
	},
	tasks: {
		ar: "مهام",
		en: "tasks"
	},
	toastDone: {
		ar: "اتسجل",
		en: "Logged"
	},
	toastLate: {
		ar: "اتسجل متأخر",
		en: "Logged late"
	},
	toastFood: {
		ar: "الوجبة اتحفظت",
		en: "Meal saved"
	},
	toastPrayer: {
		ar: "الصلاة اتسجلت",
		en: "Prayer saved"
	},
	reset: {
		ar: "مسح البيانات المحلية",
		en: "Reset local data"
	},
	replaySetup: {
		ar: "إعادة الإعداد",
		en: "Replay setup"
	},
	showTracking: {
		ar: "إظهار النقاط والاستريك والتغذية",
		en: "Show points, streak, and nutrition"
	},
	city: {
		ar: "المدينة",
		en: "City"
	},
	country: {
		ar: "الدولة",
		en: "Country"
	},
	targets: {
		ar: "الأهداف",
		en: "Targets"
	},
	apply: {
		ar: "تطبيق",
		en: "Apply"
	},
	mosque: {
		ar: "المسجد",
		en: "Mosque"
	},
	home: {
		ar: "البيت",
		en: "Home"
	},
	workPlace: {
		ar: "الشغل",
		en: "Work"
	},
	other: {
		ar: "مكان تاني",
		en: "Other"
	},
	prayerTitle: {
		ar: "صليت فين؟",
		en: "How did you pray?"
	},
	onTime: {
		ar: "في وقتها",
		en: "On time"
	},
	foodTitle: {
		ar: "إيه اللي أكلته؟",
		en: "What did you eat?"
	},
	foodSub: {
		ar: "اختار الوجبة المخططة أو اكتب الوصف.",
		en: "Use the planned plate or describe what you ate."
	},
	compute: {
		ar: "احفظ الوجبة",
		en: "Save meal"
	},
	estimating: {
		ar: "بيحسب القيم…",
		en: "Estimating macros…"
	},
	peakStart: {
		ar: "بداية التركيز",
		en: "Peak start"
	},
	peakEnd: {
		ar: "نهاية التركيز",
		en: "Peak end"
	},
	loginTitle: {
		ar: "ادخل على جدولك",
		en: "Open your week"
	},
	daysCompleted: {
		ar: "أيام مكتملة",
		en: "Days complete"
	},
	nowLabel: {
		ar: "البلوك الحالي",
		en: "Current block"
	},
	open: {
		ar: "مفتوح",
		en: "Open"
	}
};
function t(lang, key) {
	return dict[key][lang];
}
var DAY_FULL = {
	ar: [
		"الأحد",
		"الاثنين",
		"الثلاثاء",
		"الأربعاء",
		"الخميس",
		"الجمعة",
		"السبت"
	],
	en: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday"
	]
};
var DAY_SHORT = {
	ar: [
		"أحد",
		"اثنين",
		"ثلاثاء",
		"أربعاء",
		"خميس",
		"جمعة",
		"سبت"
	],
	en: [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	]
};
function dayName(lang, jd, short = false) {
	return (short ? DAY_SHORT[lang] : DAY_FULL[lang])[jd] ?? "";
}
var CAT_LABEL = {
	prayer: {
		ar: "صلاة",
		en: "Prayer"
	},
	food: {
		ar: "أكل",
		en: "Meal"
	},
	gym: {
		ar: "جيم",
		en: "Gym"
	},
	swim: {
		ar: "سباحة",
		en: "Swim"
	},
	recovery: {
		ar: "ريكفري",
		en: "Recovery"
	},
	quran: {
		ar: "قرآن",
		en: "Quran"
	},
	prog: {
		ar: "شغل عميق",
		en: "Deep work"
	},
	sleep: {
		ar: "نوم",
		en: "Sleep"
	},
	free: {
		ar: "حر",
		en: "Free"
	},
	snack: {
		ar: "سناك",
		en: "Snack"
	},
	sunrise: {
		ar: "شروق",
		en: "Sunrise"
	},
	work: {
		ar: "عمل",
		en: "Work"
	},
	admin: {
		ar: "إداري",
		en: "Admin"
	}
};
function catName(lang, cat) {
	const row = CAT_LABEL[cat];
	return row ? row[lang] : cat;
}
function loc(lang, ar, en) {
	return lang === "ar" ? ar : en;
}
var Sheet = Dialog$1;
function SheetContent({ className, children, title, side = "right", ...props }) {
	const pos = side === "bottom" ? "inset-x-0 bottom-0 max-h-[88vh] rounded-t-xl" : side === "left" ? "inset-y-0 left-0 h-full w-[min(100vw,380px)] rounded-r-xl" : "inset-y-0 right-0 h-full w-[min(100vw,380px)] rounded-l-xl";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed z-50 overflow-y-auto border border-border bg-surface p-5 shadow-panel", pos, className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "text-base font-semibold text-fg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				className: "rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), children]
	})] });
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-24 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function AssistantPanel({ open, onOpenChange }) {
	const lang = useAppStore((s) => s.settings.lang);
	const chat = useAppStore((s) => s.chat);
	const send = useAppStore((s) => s.sendAssistant);
	const clear = useAppStore((s) => s.clearChat);
	const [text, setText] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	async function onSend() {
		const v = text.trim();
		if (!v || busy) return;
		setText("");
		setBusy(true);
		await send(v);
		setBusy(false);
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			title: t(lang, "assistant"),
			side: "bottom",
			className: "flex max-h-[88vh] flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-xs text-fg-muted",
					children: t(lang, "askPlaceholder")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-h-40 flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-bg-elevated p-3",
					children: [
						(chat?.messages ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "py-8 text-center text-sm text-fg-subtle",
							children: t(lang, "askPlaceholder")
						}) : chat?.messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "ms-auto bg-primary text-primary-fg" : "bg-surface text-fg"}`,
							children: m.content.replace(/```json[\s\S]*?```/g, "").trim()
						}, m.id)),
						busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-fg-subtle",
							children: t(lang, "thinking")
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-end gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "min-h-12 flex-1",
							rows: 2,
							placeholder: t(lang, "askPlaceholder"),
							value: text,
							onChange: (e) => setText(e.target.value),
							onKeyDown: (e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									onSend();
								}
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "icon",
							onClick: () => void onSend(),
							disabled: busy || !text.trim(),
							"aria-label": t(lang, "send"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "icon",
							variant: "ghost",
							onClick: clear,
							"aria-label": t(lang, "newChat"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center gap-1.5 text-[11px] text-fg-subtle",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3" }), t(lang, "assistant")]
				})
			]
		})
	});
}
function Progress({ value, className, barClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-1.5 overflow-hidden rounded-full bg-border", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("h-full rounded-full bg-accent transition-[width] duration-300", barClassName),
			style: { width: `${Math.min(100, Math.max(0, value))}%` }
		})
	});
}
function Separator({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-px w-full bg-border", className) });
}
function HistorySheet({ open, onOpenChange }) {
	const lang = useAppStore((s) => s.settings.lang);
	const days = lastNDays(useAppStore((s) => s.history), useAppStore((s) => s.schedule), useAppStore((s) => s.selectedDate), 14);
	const report = buildReportNow();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			title: t(lang, "history"),
			side: "bottom",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-border bg-bg-elevated p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold",
						children: t(lang, "weekReport")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xl font-semibold tabular-nums",
								children: report.totalPts
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-fg-subtle",
								children: t(lang, "points")
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xl font-semibold tabular-nums",
								children: report.daysCompleted
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-fg-subtle",
								children: t(lang, "daysCompleted")
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xl font-semibold tabular-nums",
								children: report.tasksMissed
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-fg-subtle",
								children: t(lang, "missed")
							})] })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-4" }),
				days.every((d) => d.total === 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-8 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: t(lang, "noHistory")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-fg-muted",
						children: t(lang, "noHistoryHint")
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2",
					children: days.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg border border-border bg-bg-elevated px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-medium",
								children: [
									dayName(lang, d.jd),
									" · ",
									d.date
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums text-fg-muted",
								children: [
									d.done,
									"/",
									d.total
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: d.total ? d.done / d.total * 100 : 0 })]
					}, d.date))
				})
			]
		})
	});
}
var Dialog = Dialog$1;
function DialogContent({ className, children, title, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed top-1/2 left-1/2 z-50 max-h-[min(90vh,720px)] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-panel", className),
		...props,
		children: [title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-4 flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "text-base font-semibold text-fg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				className: "rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}) : null, children]
	})] });
}
function FoodLogDialog({ open, onOpenChange, task }) {
	const lang = useAppStore((s) => s.settings.lang);
	const logPlannedFood = useAppStore((s) => s.logPlannedFood);
	const logFood = useAppStore((s) => s.logFood);
	const estimateFood = useAppStore((s) => s.estimateFood);
	const [text, setText] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (!task) return null;
	const planned = task.targetMacros;
	async function saveCustom() {
		if (!task) return;
		setBusy(true);
		const res = await estimateFood(text);
		setBusy(false);
		if (!res.ok || !res.entry) {
			toast.error(t(lang, "noMatch"));
			return;
		}
		const entry = {
			mealKey: task.mealKey ?? task.id,
			taskId: task.id,
			items: res.entry.items,
			macro: res.entry.macro,
			source: "logged",
			at: (/* @__PURE__ */ new Date()).toISOString(),
			estimated: res.entry.estimated
		};
		logFood(task, entry);
		toast.success(t(lang, "toastFood"));
		setText("");
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			title: t(lang, "foodTitle"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-fg-muted",
					children: t(lang, "foodSub")
				}),
				planned ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "mb-3 w-full rounded-lg border border-border bg-bg-elevated p-3 text-start hover:border-border-strong",
					onClick: () => {
						logPlannedFood(task);
						toast.success(t(lang, "toastFood"));
						onOpenChange(false);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: t(lang, "applyPlanned")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 text-xs text-fg-muted",
							dir: "ltr",
							children: [
								planned.k,
								" kcal · P ",
								planned.p,
								" · C ",
								planned.c,
								" · F ",
								planned.f
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-xs text-fg-subtle",
							children: loc(lang, task.descAr, task.desc)
						})
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					placeholder: t(lang, "foodPlaceholder"),
					value: text,
					onChange: (e) => setText(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-3 w-full",
					disabled: !text.trim() || busy,
					onClick: () => void saveCustom(),
					children: busy ? t(lang, "estimating") : t(lang, "compute")
				})
			]
		})
	});
}
function Row({ label, value, target, barClass }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-12 shrink-0 text-[11px] font-medium text-fg-subtle",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
				value: pct(value, target),
				className: "flex-1",
				barClassName: barClass
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "w-16 shrink-0 text-end text-[11px] tabular-nums text-fg-muted",
				dir: "ltr",
				children: [
					Math.round(value),
					"/",
					target
				]
			})
		]
	});
}
function MacroPanel() {
	const lang = useAppStore((s) => s.settings.lang);
	const show = useAppStore((s) => s.settings.showTracking);
	const settings = useAppStore((s) => s.settings);
	const logs = useAppStore((s) => s.foodLogs[s.selectedDate]);
	if (!show) return null;
	const m = dayMacros(logs);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-surface p-3.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-semibold text-fg-muted",
				children: t(lang, "nutrition")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-semibold tabular-nums text-fg",
				children: [
					Math.round(m.k),
					" / ",
					settings.kcalTarget,
					" ",
					t(lang, "kcal")
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: t(lang, "protein"),
					value: m.p,
					target: settings.proteinTarget,
					barClass: "bg-success"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: t(lang, "carbs"),
					value: m.c,
					target: settings.carbsTarget,
					barClass: "bg-warn"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: t(lang, "fat"),
					value: m.f,
					target: settings.fatTarget,
					barClass: "bg-cat-sleep"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					label: t(lang, "fiber"),
					value: m.b,
					target: settings.fiberTarget,
					barClass: "bg-cat-swim"
				})
			]
		})]
	});
}
var EMPTY_ONBOARDING = {
	name: "",
	trackPrayers: true,
	peakStart: "08:00",
	peakEnd: "11:00",
	logoff: "17:30",
	buildMode: "template",
	workspaceName: ""
};
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-fg-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		className: cn("text-xs font-medium text-fg-muted", className),
		...props
	});
}
function OnboardingFlow() {
	const lang = useAppStore((s) => s.settings.lang);
	const finish = useAppStore((s) => s.finishOnboarding);
	const patch = useAppStore((s) => s.patchSettings);
	const [step, setStep] = (0, import_react.useState)(0);
	const [a, setA] = (0, import_react.useState)(EMPTY_ONBOARDING);
	function next() {
		if (step < 4) setStep(step + 1);
		else finish(a);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/80 p-4 sm:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium tracking-wide text-fg-subtle uppercase",
						children: t(lang, "appName")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold tracking-tight",
						children: t(lang, "onboardingTitle")
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-fg-muted",
							onClick: () => patch({ lang: lang === "ar" ? "en" : "ar" }),
							children: lang === "ar" ? "EN" : "ع"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 text-sm text-fg-muted",
					children: t(lang, "onboardingSub")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
					value: (step + 1) / 5 * 100,
					className: "mb-5"
				}),
				step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "onboardingName") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					placeholder: t(lang, "onboardingNamePh"),
					value: a.name,
					onChange: (e) => setA({
						...a,
						name: e.target.value
					})
				})] }) : null,
				step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t(lang, "onboardingPrayers")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setA({
								...a,
								trackPrayers: true
							}),
							className: `rounded-lg border p-3 text-start ${a.trackPrayers ? "border-primary bg-primary/10" : "border-border"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium",
								children: t(lang, "onboardingPrayersYes")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-fg-muted",
								children: t(lang, "onboardingPrayersYesDesc")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setA({
								...a,
								trackPrayers: false
							}),
							className: `rounded-lg border p-3 text-start ${!a.trackPrayers ? "border-primary bg-primary/10" : "border-border"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium",
								children: t(lang, "onboardingPrayersNo")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-fg-muted",
								children: t(lang, "onboardingPrayersNoDesc")
							})]
						})
					]
				}) : null,
				step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-2 text-sm font-medium",
								children: t(lang, "onboardingPeak")
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "peakStart") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "time",
							value: a.peakStart,
							onChange: (e) => setA({
								...a,
								peakStart: e.target.value
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "peakEnd") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "time",
							value: a.peakEnd,
							onChange: (e) => setA({
								...a,
								peakEnd: e.target.value
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "onboardingLogoff") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								type: "time",
								value: a.logoff,
								onChange: (e) => setA({
									...a,
									logoff: e.target.value
								})
							})]
						})
					]
				}) : null,
				step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: t(lang, "onboardingMode")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setA({
								...a,
								buildMode: "template"
							}),
							className: `rounded-lg border p-3 text-start ${a.buildMode === "template" ? "border-primary bg-primary/10" : "border-border"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium",
								children: t(lang, "onboardingTemplate")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-fg-muted",
								children: t(lang, "onboardingTemplateDesc")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setA({
								...a,
								buildMode: "custom"
							}),
							className: `rounded-lg border p-3 text-start ${a.buildMode === "custom" ? "border-primary bg-primary/10" : "border-border"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium",
								children: t(lang, "onboardingCustom")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-fg-muted",
								children: t(lang, "onboardingCustomDesc")
							})]
						})
					]
				}) : null,
				step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "onboardingWs") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					placeholder: t(lang, "onboardingWsPh"),
					value: a.workspaceName,
					onChange: (e) => setA({
						...a,
						workspaceName: e.target.value
					})
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex gap-2",
					children: [step > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "flex-1",
						onClick: () => setStep(step - 1),
						children: t(lang, "back")
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						onClick: next,
						disabled: step === 0 && !a.name.trim(),
						children: step === 4 ? t(lang, "finish") : t(lang, "next")
					})]
				})
			]
		})
	});
}
function Stat({ icon: Icon, value, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-col items-center gap-0.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-3 text-fg-subtle sm:size-3.5",
				strokeWidth: 1.75
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold tabular-nums tracking-tight text-fg sm:text-xl",
				children: value
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden text-xs font-medium tracking-wide text-fg-subtle uppercase sm:block",
			children: label
		})]
	});
}
function StatsBar() {
	const lang = useAppStore((s) => s.settings.lang);
	const stats = useAppStore((s) => s.stats);
	if (!useAppStore((s) => s.settings.showTracking)) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: Star,
				value: stats.pts,
				label: t(lang, "points")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: Flame,
				value: stats.cur,
				label: t(lang, "streak")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				icon: Trophy,
				value: stats.best,
				label: t(lang, "best")
			})
		]
	});
}
var PLACES = [
	"mosque",
	"home",
	"work",
	"other"
];
function PrayerLogDialog({ open, onOpenChange, task }) {
	const lang = useAppStore((s) => s.settings.lang);
	const logPrayer = useAppStore((s) => s.logPrayer);
	const [place, setPlace] = (0, import_react.useState)("mosque");
	const [onTime, setOnTime] = (0, import_react.useState)(true);
	if (!task) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			title: t(lang, "prayerTitle"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-fg-muted",
					children: loc(lang, task.nameAr, task.name)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: PLACES.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPlace(p),
						className: `rounded-lg border px-3 py-2 text-sm ${place === p ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted"}`,
						children: t(lang, p === "work" ? "workPlace" : p)
					}, p))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOnTime(true),
						className: `rounded-lg border px-3 py-2 text-sm ${onTime ? "border-success bg-success/15 text-success" : "border-border text-fg-muted"}`,
						children: t(lang, "onTime")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOnTime(false),
						className: `rounded-lg border px-3 py-2 text-sm ${!onTime ? "border-warn bg-warn/15 text-warn" : "border-border text-fg-muted"}`,
						children: t(lang, "qada")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-4 w-full",
					onClick: () => {
						logPrayer(task.id, {
							place,
							onTime,
							at: (/* @__PURE__ */ new Date()).toISOString()
						});
						onOpenChange(false);
					},
					children: t(lang, "save")
				})
			]
		})
	});
}
function PrayerPills() {
	const lang = useAppStore((s) => s.settings.lang);
	const track = useAppStore((s) => s.settings.trackPrayers);
	const times = useAppStore((s) => s.prayerTimes);
	const done = useAppStore((s) => s.history[s.selectedDate]?.done);
	const day = useAppStore((s) => s.schedule[s.selectedJd]);
	if (!track) return null;
	const tasks = withPrayerTasks(day?.tasks ?? [], times, true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex w-max gap-1.5",
			children: PRAYER_META.map((p) => {
				const task = tasks.find((t) => t.id === `prayer-${p.key}` || t.id === p.key);
				const logged = task ? Boolean(done?.[task.id]) : false;
				const time = times[p.key];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("min-w-16 shrink-0 rounded-lg border px-2.5 py-1.5 text-center", logged ? "border-success/40 bg-success/10" : "border-border bg-surface"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] font-medium text-fg-muted",
						children: loc(lang, p.ar, p.en)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-semibold tabular-nums",
						dir: "ltr",
						children: lang === "ar" ? formatArabicTime(time) : formatEnglishTime(time)
					})]
				}, p.key);
			})
		})
	});
}
function Badge({ className, tone = "muted", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", {
			muted: "bg-surface-2 text-fg-muted border-border",
			success: "bg-success/15 text-success border-success/30",
			warn: "bg-warn/15 text-warn border-warn/30",
			accent: "bg-accent/15 text-accent border-accent/30",
			danger: "bg-danger/15 text-danger border-danger/30"
		}[tone], className),
		...props
	});
}
var EMPTY_DONE$1 = {};
function DayHeader({ onAdd }) {
	const lang = useAppStore((s) => s.settings.lang);
	const date = useAppStore((s) => s.selectedDate);
	const day = useAppStore((s) => s.schedule[s.selectedJd]);
	const times = useAppStore((s) => s.prayerTimes);
	const track = useAppStore((s) => s.settings.trackPrayers);
	const done = useAppStore((s) => s.history[s.selectedDate]?.done);
	const show = useAppStore((s) => s.settings.showTracking);
	const prog = dayProgress(withPrayerTasks(day?.tasks ?? [], times, track), done ?? EMPTY_DONE$1);
	const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-surface p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: loc(lang, day?.nameAr ?? "", day?.name ?? "")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 text-xs text-fg-muted",
				dir: "ltr",
				children: date
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [day?.gym ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: "danger",
					children: day.gym === "upper" ? t(lang, "upper") : t(lang, "lower")
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t(lang, "restDay") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "secondary",
					onClick: onAdd,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), t(lang, "addTask")]
				})]
			})]
		}), show ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1.5 flex justify-between text-xs text-fg-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					prog.done,
					"/",
					prog.total,
					" ",
					t(lang, "tasks")
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "tabular-nums",
					children: [
						prog.pts,
						" ",
						t(lang, "ptsToday")
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: pct })]
		}) : null]
	});
}
function DayTabs() {
	const lang = useAppStore((s) => s.settings.lang);
	const selectedJd = useAppStore((s) => s.selectedJd);
	const selectDay = useAppStore((s) => s.selectDay);
	const today = todayISO();
	const todayJ = todayJD();
	const start = weekStartSaturday(today);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex w-max gap-1.5",
			children: [
				6,
				0,
				1,
				2,
				3,
				4,
				5
			].map((jd) => {
				const date = dateForWeekday(jd, today);
				const active = selectedJd === jd;
				const isToday = jd === todayJ;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => selectDay(jd, date),
					className: cn("flex min-w-14 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors", active ? "border-primary bg-primary text-primary-fg" : isToday ? "border-success/50 bg-surface text-success" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dayName(lang, jd, true) }), isToday ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-0.5 size-1 rounded-full bg-current opacity-70" }) : null]
				}, jd);
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: start
		})]
	});
}
var TASK_CATEGORIES = [
	"prayer",
	"food",
	"gym",
	"swim",
	"recovery",
	"quran",
	"prog",
	"sleep",
	"free",
	"snack",
	"sunrise",
	"work",
	"admin"
];
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-2 transition-colors", "data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg shadow transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-accent-fg" })
	});
}
function TaskEditor({ open, onOpenChange, task }) {
	const lang = useAppStore((s) => s.settings.lang);
	const jd = useAppStore((s) => s.selectedJd);
	const saveTask = useAppStore((s) => s.saveTask);
	const deleteTask = useAppStore((s) => s.deleteTask);
	const [name, setName] = (0, import_react.useState)("");
	const [start, setStart] = (0, import_react.useState)("08:00");
	const [end, setEnd] = (0, import_react.useState)("09:00");
	const [category, setCategory] = (0, import_react.useState)("prog");
	const [desc, setDesc] = (0, import_react.useState)("");
	const [pts, setPts] = (0, import_react.useState)(10);
	const [optional, setOptional] = (0, import_react.useState)(false);
	const [foodLog, setFoodLog] = (0, import_react.useState)(false);
	const [days, setDays] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setName(task ? lang === "ar" ? task.nameAr : task.name : "");
		setStart(task?.start ?? "08:00");
		setEnd(task?.end ?? "09:00");
		setCategory(task?.category ?? "prog");
		setDesc(task ? lang === "ar" ? task.descAr : task.desc : "");
		setPts(task?.pts ?? 10);
		setOptional(Boolean(task?.optional));
		setFoodLog(Boolean(task?.foodLog));
		setDays([jd]);
	}, [
		open,
		task,
		jd,
		lang
	]);
	function toggleDay(d) {
		setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
	}
	function save() {
		const next = {
			id: task?.id ?? newTaskId(),
			start,
			end,
			category,
			name: lang === "en" ? name : task?.name || name,
			nameAr: lang === "ar" ? name : task?.nameAr || name,
			desc: lang === "en" ? desc : task?.desc || desc,
			descAr: lang === "ar" ? desc : task?.descAr || desc,
			pts: Number(pts) || 0,
			notify: true,
			optional,
			foodLog: foodLog || category === "food" || category === "snack",
			mealKey: task?.mealKey,
			targetMacros: task?.targetMacros
		};
		saveTask(jd, next, days);
		onOpenChange(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			title: task ? t(lang, "editTask") : t(lang, "addTask"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "name") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						value: name,
						onChange: (e) => setName(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "startTime") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "time",
							value: start,
							onChange: (e) => setStart(e.target.value)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "endTime") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "time",
							value: end,
							onChange: (e) => setEnd(e.target.value)
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "category") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "mt-1 h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
						value: category,
						onChange: (e) => setCategory(e.target.value),
						children: TASK_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							children: catName(lang, c)
						}, c))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "description") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-1",
						value: desc,
						onChange: (e) => setDesc(e.target.value)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "pts") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "number",
						value: pts,
						onChange: (e) => setPts(Number(e.target.value))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "days") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1.5",
						children: [
							6,
							0,
							1,
							2,
							3,
							4,
							5
						].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => toggleDay(d),
							className: `rounded-md border px-2 py-1 text-xs ${days.includes(d) ? "border-primary bg-primary text-primary-fg" : "border-border text-fg-muted"}`,
							children: dayName(lang, d, true)
						}, d))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(lang, "optional") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: optional,
							onCheckedChange: setOptional
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(lang, "foodToggle") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: foodLog,
							onCheckedChange: setFoodLog
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "flex-1",
							onClick: save,
							disabled: !name.trim(),
							children: t(lang, "save")
						}), task ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: () => {
								deleteTask(jd, task.id);
								onOpenChange(false);
							},
							children: t(lang, "deleteTask")
						}) : null]
					})
				]
			})
		})
	});
}
var CATEGORY_COLOR = {
	prayer: "var(--color-cat-prayer)",
	food: "var(--color-cat-food)",
	gym: "var(--color-cat-gym)",
	swim: "var(--color-cat-swim)",
	recovery: "var(--color-cat-recovery)",
	quran: "var(--color-cat-quran)",
	prog: "var(--color-cat-prog)",
	sleep: "var(--color-cat-sleep)",
	free: "var(--color-cat-free)",
	snack: "var(--color-cat-snack)",
	sunrise: "var(--color-cat-sunrise)",
	work: "var(--color-cat-prog)",
	admin: "var(--color-cat-free)"
};
var CATEGORY_ICON = {
	prayer: "Moon",
	food: "Utensils",
	gym: "Dumbbell",
	swim: "Waves",
	recovery: "HeartPulse",
	quran: "BookOpen",
	prog: "Code2",
	sleep: "MoonStar",
	free: "Coffee",
	snack: "Apple",
	sunrise: "Sunrise",
	work: "Briefcase",
	admin: "Inbox"
};
var ICONS = {
	Moon,
	Utensils,
	Dumbbell,
	Waves,
	HeartPulse,
	BookOpen,
	Code2: CodeXml,
	MoonStar,
	Coffee,
	Apple,
	Sunrise,
	Briefcase,
	Inbox
};
function CategoryIcon({ category, className }) {
	const Icon = ICONS[CATEGORY_ICON[category]] ?? Inbox;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
		className: cn("size-4", className),
		strokeWidth: 1.75
	});
}
function TaskCard({ task, done, lang, onComplete, onUndo, onEdit, onLogFood, onLogPrayer }) {
	const current = !done && isCurrentTask(task);
	const time = lang === "ar" ? formatArabicTime(task.start) : formatEnglishTime(task.start);
	const end = task.end ? lang === "ar" ? formatArabicTime(task.end) : formatEnglishTime(task.end) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		"data-task-id": task.id,
		className: cn("relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 transition-shadow sm:flex-row sm:items-start", done && "border-success/30 bg-success/5", current && "ring-2 ring-accent/50 shadow-panel"),
		style: {
			borderInlineStartWidth: 3,
			borderInlineStartColor: CATEGORY_COLOR[task.category]
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 flex-1 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-14 shrink-0 pt-0.5 text-start text-[11px] font-medium text-fg-subtle tabular-nums",
					dir: "ltr",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: time }), end ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "opacity-70",
						children: end
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-8 shrink-0 place-items-center rounded-md border border-border bg-bg-elevated text-fg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, { category: task.category })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-sm font-semibold text-fg",
									children: loc(lang, task.nameAr, task.name)
								}),
								task.optional ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t(lang, "optional") }) : null,
								current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: "accent",
									children: t(lang, "current")
								}) : null,
								done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: done.status === "ontime" ? "success" : done.status === "late" ? "warn" : "muted",
									children: done.status === "ontime" ? t(lang, "done") : done.status === "late" ? t(lang, "late") : t(lang, "qada")
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs leading-relaxed text-fg-muted",
							children: loc(lang, task.descAr, task.desc) || catName(lang, task.category)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[11px] text-fg-subtle tabular-nums",
								children: [
									task.pts,
									" ",
									t(lang, "pts")
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-[11px] text-fg-subtle hover:text-fg",
								onClick: onEdit,
								children: t(lang, "editTask")
							})]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0 sm:self-start",
			children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "ghost",
				className: "w-full sm:w-auto",
				onClick: onUndo,
				children: t(lang, "undo")
			}) : task.foodLog ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				className: "w-full sm:w-auto",
				onClick: onLogFood,
				children: t(lang, "logFood")
			}) : task.category === "prayer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				className: "w-full sm:w-auto",
				onClick: onLogPrayer,
				children: t(lang, "log")
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "secondary",
				className: "w-full sm:w-auto",
				onClick: onComplete,
				children: t(lang, "markDone")
			})
		})]
	});
}
var EMPTY_DONE = {};
function Timeline({ onEdit, onLogFood, onLogPrayer }) {
	const lang = useAppStore((s) => s.settings.lang);
	const jd = useAppStore((s) => s.selectedJd);
	const day = useAppStore((s) => s.schedule[s.selectedJd]);
	const times = useAppStore((s) => s.prayerTimes);
	const track = useAppStore((s) => s.settings.trackPrayers);
	const done = useAppStore((s) => s.history[s.selectedDate]?.done);
	const complete = useAppStore((s) => s.complete);
	const uncomplete = useAppStore((s) => s.uncomplete);
	const applyTemplate = useAppStore((s) => s.applyTemplate);
	const tasks = withPrayerTasks(day?.tasks ?? [], times, track);
	const currentId = currentTaskId(tasks);
	const doneMap = done ?? EMPTY_DONE;
	(0, import_react.useEffect)(() => {
		if (!currentId) return;
		document.querySelector(`[data-task-id="${currentId}"]`)?.scrollIntoView({
			block: "center",
			behavior: "smooth"
		});
	}, [currentId, jd]);
	if (tasks.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-dashed border-border bg-surface/50 px-5 py-12 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: t(lang, "emptyDay")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-fg-muted",
				children: t(lang, "emptyDayHint")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				variant: "secondary",
				onClick: applyTemplate,
				children: t(lang, "useTemplate")
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex flex-col gap-2 ps-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-2 bottom-2 start-0 w-px bg-border" }), tasks.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskCard, {
			task,
			done: doneMap[task.id],
			lang,
			onComplete: () => {
				const r = complete(task);
				toast.success(r.status === "late" ? t(lang, "toastLate") : t(lang, "toastDone"));
			},
			onUndo: () => uncomplete(task.id),
			onEdit: () => onEdit(task),
			onLogFood: () => onLogFood(task),
			onLogPrayer: () => onLogPrayer(task)
		}, task.id))]
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of).
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
function SettingsScreen({ open, onOpenChange }) {
	const lang = useAppStore((s) => s.settings.lang);
	const settings = useAppStore((s) => s.settings);
	const patch = useAppStore((s) => s.patchSettings);
	const replay = useAppStore((s) => s.replayOnboarding);
	const reset = useAppStore((s) => s.resetLocal);
	const applyTemplate = useAppStore((s) => s.applyTemplate);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			title: t(lang, "settings"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-wide text-fg-subtle uppercase",
							children: t(lang, "general")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "displayName") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: settings.displayName,
							onChange: (e) => patch({ displayName: e.target.value })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "workspace") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							value: settings.workspaceName,
							onChange: (e) => patch({ workspaceName: e.target.value })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "language") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: lang === "ar" ? "default" : "secondary",
								onClick: () => patch({ lang: "ar" }),
								children: "العربية"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: lang === "en" ? "default" : "secondary",
								onClick: () => patch({ lang: "en" }),
								children: "English"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(lang, "trackPrayers") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: settings.trackPrayers,
								onCheckedChange: (v) => patch({ trackPrayers: v })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t(lang, "showTracking") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: settings.showTracking,
								onCheckedChange: (v) => patch({ showTracking: v })
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-wide text-fg-subtle uppercase",
							children: t(lang, "schedule")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "peakStart") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								type: "time",
								value: settings.peakStart,
								onChange: (e) => patch({ peakStart: e.target.value })
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "peakEnd") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "mt-1",
								type: "time",
								value: settings.peakEnd,
								onChange: (e) => patch({ peakEnd: e.target.value })
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, "onboardingLogoff") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-1",
							type: "time",
							value: settings.logoff,
							onChange: (e) => patch({ logoff: e.target.value })
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: applyTemplate,
							children: t(lang, "useTemplate")
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-semibold tracking-wide text-fg-subtle uppercase",
						children: t(lang, "targets")
					}), [
						["kcalTarget", "kcal"],
						["proteinTarget", "protein"],
						["carbsTarget", "carbs"],
						["fatTarget", "fat"],
						["fiberTarget", "fiber"]
					].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: t(lang, label) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "mt-1",
						type: "number",
						value: settings[key],
						onChange: (e) => patch({ [key]: Number(e.target.value) })
					})] }, key))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-semibold tracking-wide text-fg-subtle uppercase",
							children: t(lang, "account")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "secondary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								children: t(lang, "signIn")
							})
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "secondary",
							onClick: replay,
							children: t(lang, "replaySetup")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "danger",
							onClick: reset,
							children: t(lang, "reset")
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-relaxed text-fg-muted",
					children: t(lang, "aboutBody")
				})
			]
		})
	});
}
function AppShell() {
	const { user, isPending } = useCurrentUserState();
	const hydrated = useAppStore((s) => s.hydrated);
	const hydrate = useAppStore((s) => s.hydrate);
	const lang = useAppStore((s) => s.settings.lang);
	const onboarded = useAppStore((s) => s.settings.onboardingComplete);
	const workspace = useAppStore((s) => s.settings.workspaceName);
	const displayName = useAppStore((s) => s.settings.displayName);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [historyOpen, setHistoryOpen] = (0, import_react.useState)(false);
	const [aiOpen, setAiOpen] = (0, import_react.useState)(false);
	const [editorOpen, setEditorOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [foodTask, setFoodTask] = (0, import_react.useState)(null);
	const [prayerTask, setPrayerTask] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		hydrate(Boolean(user));
	}, [
		hydrate,
		isPending,
		user?.id
	]);
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = lang === "ar" ? "ar" : "en";
		document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	}, [lang]);
	if (!hydrated || isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium tracking-wide text-fg-subtle uppercase",
				children: "Smart Schedule"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-semibold tracking-tight text-fg",
				children: "الجدول الذكي"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg-muted",
				children: "Protect focus. Keep the rest honest."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-1/2 animate-pulse rounded-full bg-accent" })
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh overflow-x-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-center",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-3xl items-center gap-2 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[11px] font-medium tracking-wide text-fg-subtle uppercase",
								children: t(lang, "appName")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-semibold",
								children: workspace || displayName || t(lang, "today")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsBar, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => setHistoryOpen(true),
									"aria-label": t(lang, "history"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => setSettingsOpen(true),
									"aria-label": t(lang, "settings"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "secondary",
									asChild: true,
									className: "hidden sm:inline-flex",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										children: t(lang, "signIn")
									})
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden max-w-24 truncate text-xs text-fg-muted sm:inline",
									children: user?.displayName?.split(" ")[0]
								}) })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-3xl px-4 pb-3 sm:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsBar, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 pb-28",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayTabs, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayHeader, { onAdd: () => {
						setEditing(null);
						setEditorOpen(true);
					} }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrayerPills, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MacroPanel, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Timeline, {
						onEdit: (task) => {
							setEditing(task);
							setEditorOpen(true);
						},
						onLogFood: (task) => setFoodTask(task),
						onLogPrayer: (task) => setPrayerTask(task)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setAiOpen(true),
				className: "fixed end-4 bottom-5 z-20 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg shadow-panel",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-4" }), t(lang, "assistant")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaskEditor, {
				open: editorOpen,
				onOpenChange: setEditorOpen,
				task: editing
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FoodLogDialog, {
				open: Boolean(foodTask),
				onOpenChange: (v) => !v && setFoodTask(null),
				task: foodTask
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrayerLogDialog, {
				open: Boolean(prayerTask),
				onOpenChange: (v) => !v && setPrayerTask(null),
				task: prayerTask
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsScreen, {
				open: settingsOpen,
				onOpenChange: setSettingsOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistorySheet, {
				open: historyOpen,
				onOpenChange: setHistoryOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssistantPanel, {
				open: aiOpen,
				onOpenChange: setAiOpen
			}),
			!onboarded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnboardingFlow, {}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
