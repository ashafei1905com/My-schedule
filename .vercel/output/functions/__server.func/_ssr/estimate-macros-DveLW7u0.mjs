import { n as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CN-evIEF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/estimate-macros-DveLW7u0.js
var estimateMacrosRemote_createServerFn_handler = createServerRpc({
	id: "ac35c86094b78c325ae9ea358e8289742ee13c75ff235d92f3960edeaaa908f7",
	name: "estimateMacrosRemote",
	filename: "src/features/nutrition/services/estimate-macros.ts"
}, (opts) => estimateMacrosRemote.__executeServer(opts));
var estimateMacrosRemote = createServerFn({ method: "POST" }).validator((input) => input).handler(estimateMacrosRemote_createServerFn_handler, async ({ data }) => {
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
			max_tokens: 400,
			messages: [{
				role: "system",
				content: "You are a precise nutrition estimator. Reply with ONLY JSON: {\"canonicalName\":string,\"estimatedGrams\":number,\"macroPer100g\":{\"p\":n,\"c\":n,\"f\":n,\"b\":n,\"k\":n}}. Numbers must be finite and non-negative. k should roughly equal p*4+c*4+f*9. No markdown."
			}, {
				role: "user",
				content: data.text.slice(0, 400)
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI ${res.status}`
	};
	const jsonText = ((await res.json()).choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
	try {
		const parsed = JSON.parse(jsonText);
		const m = parsed.macroPer100g;
		const g = Number(parsed.estimatedGrams);
		if (!m || !Number.isFinite(g) || g <= 0 || g >= 1500) return {
			ok: false,
			error: "invalid"
		};
		const scale = g / 100;
		const macro = {
			p: Math.round(m.p * scale * 10) / 10,
			c: Math.round(m.c * scale * 10) / 10,
			f: Math.round(m.f * scale * 10) / 10,
			b: Math.round((m.b || 0) * scale * 10) / 10,
			k: Math.round(m.k * scale * 10) / 10
		};
		return {
			ok: true,
			name: parsed.canonicalName || data.text,
			grams: Math.round(g),
			macro,
			estimated: true
		};
	} catch {
		return {
			ok: false,
			error: "parse"
		};
	}
});
//#endregion
export { estimateMacrosRemote_createServerFn_handler };
