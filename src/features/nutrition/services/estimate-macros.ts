import { createServerFn } from "@tanstack/react-start";
import type { Macros } from "@/features/nutrition/models/macros";

export const estimateMacrosRemote = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              'You are a precise nutrition estimator. Reply with ONLY JSON: {"canonicalName":string,"estimatedGrams":number,"macroPer100g":{"p":n,"c":n,"f":n,"b":n,"k":n}}. Numbers must be finite and non-negative. k should roughly equal p*4+c*4+f*9. No markdown.',
          },
          { role: "user", content: data.text.slice(0, 400) },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const jsonText = raw.replace(/```json|```/g, "").trim();
    try {
      const parsed = JSON.parse(jsonText) as {
        canonicalName?: string;
        estimatedGrams?: number;
        macroPer100g?: Macros;
      };
      const m = parsed.macroPer100g;
      const g = Number(parsed.estimatedGrams);
      if (!m || !Number.isFinite(g) || g <= 0 || g >= 1500) {
        return { ok: false as const, error: "invalid" };
      }
      const scale = g / 100;
      const macro: Macros = {
        p: Math.round(m.p * scale * 10) / 10,
        c: Math.round(m.c * scale * 10) / 10,
        f: Math.round(m.f * scale * 10) / 10,
        b: Math.round((m.b || 0) * scale * 10) / 10,
        k: Math.round(m.k * scale * 10) / 10,
      };
      return {
        ok: true as const,
        name: parsed.canonicalName || data.text,
        grams: Math.round(g),
        macro,
        estimated: true,
      };
    } catch {
      return { ok: false as const, error: "parse" };
    }
  });
