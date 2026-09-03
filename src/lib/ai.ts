import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are an expert executive assistant for a bilingual (Arabic/English) daily schedule app used in Kuwait (Asia/Kuwait, Saturday-start week).

Scheduling rules you MUST follow:
1. Protect 90–120 minute uninterrupted deep-work blocks in the user's peak hours.
2. Never stack meetings or hard tasks back-to-back — insert 10–15 minute buffers.
3. Put low-energy admin (email, quick replies) in the late-afternoon slump.
4. Explicitly block lunch, a hard log-off, and sleep.
5. If the user tracks prayers, never overlap a deep-work block with Dhuhr/Asr/Maghrib/Isha/Fajr; place a short prayer block at the given times.
6. Gym days need a pre-training snack and a post-training meal.

When the user is chatting, reply in their language (Arabic if they wrote Arabic, else English). Be concise, specific, and never fluffy.

When they ask you to build or edit a schedule, ALSO append a fenced JSON block:
\`\`\`json
{"action":"upsert_tasks","days":{"1":[{"id":"mon-dw1","start":"08:00","end":"09:30","category":"prog","name":"Deep work I","nameAr":"شغل عميق ١","desc":"...","descAr":"...","pts":30,"notify":true}]}}
\`\`\`
Days keys are JS weekday numbers: 0 Sun … 6 Sat. Categories: prayer,food,gym,swim,recovery,quran,prog,sleep,free,snack,sunrise,work,admin.
Only include days you are changing. Keep 4–12 tasks per day. Times are 24h HH:MM.

If they only asked a question, do not emit JSON.`;

const FOOD_SYSTEM = `You estimate nutrition. Reply with ONLY compact JSON, no markdown:
{"canonicalName":"string","estimatedGrams":number,"macroPer100g":{"p":n,"c":n,"f":n,"b":n,"k":n}}
p/c/f/b grams, k kcal, all per 100g. estimatedGrams is the portion you inferred. Be conservative. Arabic dishes (koshari, ful, ta'meya) are in-scope.`;

async function grokChat(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens = 1200,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { ok: false, error: `xAI API error ${res.status} ${err.slice(0, 180)}` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return { ok: true, text: body.choices?.[0]?.message?.content ?? "" };
}

export const askAssistant = createServerFn({ method: "POST" })
  .validator((input: { messages: { role: "user" | "assistant"; content: string }[]; context: string }) => input)
  .handler(async ({ data }) => {
    const trimmed = data.messages.slice(-16);
    return grokChat(
      [
        { role: "system", content: SYSTEM + "\n\nCurrent board:\n" + data.context.slice(0, 6000) },
        ...trimmed,
      ],
      1400,
    );
  });

export const estimateFood = createServerFn({ method: "POST" })
  .validator((input: { description: string }) => input)
  .handler(async ({ data }) => {
    const result = await grokChat(
      [
        { role: "system", content: FOOD_SYSTEM },
        { role: "user", content: data.description.slice(0, 400) },
      ],
      400,
    );
    if (!result.ok) return result;
    try {
      const raw = result.text.trim().replace(/^```json\s*|\s*```$/g, "");
      const parsed = JSON.parse(raw) as {
        canonicalName: string;
        estimatedGrams: number;
        macroPer100g: { p: number; c: number; f: number; b: number; k: number };
      };
      const g = Number(parsed.estimatedGrams) || 100;
      const m = parsed.macroPer100g;
      const scale = g / 100;
      const r = (n: number) => Math.round((Number(n) || 0) * scale * 10) / 10;
      return {
        ok: true as const,
        name: parsed.canonicalName || data.description,
        grams: Math.round(g),
        macro: { p: r(m.p), c: r(m.c), f: r(m.f), b: r(m.b), k: r(m.k) },
        estimated: true,
      };
    } catch {
      return { ok: false as const, error: "Could not parse estimate" };
    }
  });
