const fs = require('fs');
const content = `import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";

const SYSTEM = \`You are an expert executive assistant for a bilingual (Arabic/English) daily planner called Smart Schedule (الجدول الذكي).
You specialize in hyper-personalized time blocking and cognitive load management.
Strict scheduling rules:
1. Protect Focus Time: 90–120 minute uninterrupted chunks during the user's peak energy hours.
2. Buffer Zones: never schedule back-to-back meetings. Insert a 10–15 minute buffer.
3. Productivity Rhythm: place low-energy admin in the late afternoon slump.
4. Health & Balance: explicitly block lunch, hydration, and a hard log-off.

When the user asks to rebuild or move blocks, reply with a short human message AND a JSON object in a fenced code block tagged json, shaped:
\\\`\\\`\\\`json
{"action":"patch-day","jd":0-6,"tasks":[{"id":"...","start":"HH:MM","end":"HH:MM","category":"prog|food|gym|admin|quran|sleep|free|snack|prayer|work","name":"...","nameAr":"...","desc":"...","descAr":"...","pts":10,"notify":true,"optional":false}]}
\\\`\\\`\\\`
If you are only chatting, omit the JSON.
Keep replies concise. Match the user's language (Arabic or English). Never invent a "protocol". Do not ask follow-up questions when the user already gave enough to act.\`;

export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: { messages: { role: "user" | "assistant"; content: string }[]; context: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "unavailable" };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const geminiContents = data.messages.slice(-12).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: geminiContents,
        config: {
          systemInstruction: SYSTEM + "\\n\\nCurrent board:\\n" + data.context.slice(0, 6000)
        }
      });

      const text = response.text || "";
      return { ok: true as const, text };
    } catch (err: any) {
      return { ok: false as const, error: \`Gemini API error \${err.message}\` };
    }
  });
`;

fs.writeFileSync('src/features/assistant/services/assistant-service.ts', content);
