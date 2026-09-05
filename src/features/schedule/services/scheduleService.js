import { GoogleGenAI } from '@google/genai';

export async function buildSchedule(apiKey, messyText, today, lang) {
  const system = `You are an expert AI Scheduling Agent. Turn a messy task list into a realistic daily schedule.
RULES: 15-min buffers between tasks; high-focus in the morning; every block has start, end, emoji.
Protect focus with 90-120 minute deep-work blocks in peak morning hours when possible.
Never stack meetings back-to-back — always leave a 10-15 minute buffer.
Place low-energy admin tasks in the late afternoon.
Include lunch / hydration breaks and a hard log-off if the day runs long.
Return ONLY JSON:
{"date":"YYYY-MM-DD","blocks":[{"start":"HH:MM","end":"HH:MM","task":"string","emoji":"📚","category":"Deep Work","buffer_after_min":15}],"pro_tip":"short tip"}`;

  const userContent = `Today is ${today}. Language: ${lang}.\n\nMessy task list:\n${messyText}`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userContent,
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
      temperature: 0.3
    }
  });

  return response.text || '';
}
