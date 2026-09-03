import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are an expert executive assistant for a bilingual (Arabic/English) daily planner called Smart Schedule (الجدول الذكي).
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

export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: { messages: { role: "user" | "assistant"; content: string }[]; context: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "unavailable" };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 900,
        messages: [
          { role: "system", content: `${SYSTEM}\n\nCurrent board:\n${data.context.slice(0, 6000)}` },
          ...data.messages.slice(-12),
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `xAI ${res.status}` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, text };
  });
