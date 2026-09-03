import { n as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CN-evIEF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assistant-service-CQpxaTFI.js
var SYSTEM = `You are an expert executive assistant for a bilingual (Arabic/English) daily planner called Smart Schedule (الجدول الذكي).
You specialize in hyper-personalized time blocking and cognitive load management.

Strict scheduling rules:
1. Protect Focus Time: 90–120 minute uninterrupted chunks during the user's peak energy hours.
2. Buffer Zones: never schedule back-to-back meetings. Insert a 10–15 minute buffer.
3. Productivity Rhythm: place low-energy admin in the late afternoon slump.
4. Health & Balance: explicitly block lunch, hydration, and a hard log-off.

When the user asks to rebuild or move blocks, reply with a short human message AND a JSON object in a fenced code block tagged json, shaped:
{"action":"patch-day","jd":0-6,"tasks":[{"id":"...","start":"HH:MM","end":"HH:MM","category":"prog|food|gym|admin|quran|sleep|free|snack|prayer|work","name":"...","nameAr":"...","desc":"...","descAr":"...","pts":10,"notify":true,"optional":false}]}
If you are only chatting, omit the JSON.
Keep replies concise. Match the user's language (Arabic or English). Never invent a "protocol". Do not ask follow-up questions when the user already gave enough to act.`;
var askAssistant_createServerFn_handler = createServerRpc({
	id: "b7c89a262ff9eb6a8c65f1aa56f14729de78e36a170cd32fb5e570c9fb2f207c",
	name: "askAssistant",
	filename: "src/features/assistant/services/assistant-service.ts"
}, (opts) => askAssistant.__executeServer(opts));
var askAssistant = createServerFn({ method: "POST" }).validator((input) => input).handler(askAssistant_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "unavailable"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 900,
			messages: [{
				role: "system",
				content: `${SYSTEM}\n\nCurrent board:\n${data.context.slice(0, 6e3)}`
			}, ...data.messages.slice(-12)]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI ${res.status}`
	};
	return {
		ok: true,
		text: (await res.json()).choices?.[0]?.message?.content ?? ""
	};
});
//#endregion
export { askAssistant_createServerFn_handler };
