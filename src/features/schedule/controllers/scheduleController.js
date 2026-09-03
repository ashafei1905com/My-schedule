import { buildSchedule } from '../services/scheduleService.js';
import { json } from '../../../core/utils/response.js';

export async function handleBuildSchedule(request, env) {
  try {
    if (!env.GEMINI_API_KEY) {
      return json({ error: "GEMINI_API_KEY not configured" }, 503);
    }

    const body = await request.json();
    const messyText = (body.messyText || "").trim();
    const today = body.today || new Date().toISOString().slice(0, 10);
    const lang = body.lang === "ar" ? "ar" : "en";

    if (!messyText) {
      return json({ error: "messyText is required" }, 400);
    }

    const resultText = await buildSchedule(env.GEMINI_API_KEY, messyText, today, lang);
    return json({ text: resultText }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
