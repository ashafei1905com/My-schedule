const fs = require('fs');
const content = `import { createServerFn } from "@tanstack/react-start";
import type { Macros } from "@/features/nutrition/models/macros";
import { GoogleGenAI } from "@google/genai";

export const estimateMacrosRemote = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: data.text.slice(0, 400),
        config: {
          systemInstruction: 'You are a precise nutrition estimator. Reply with ONLY JSON: {"canonicalName":string,"estimatedGrams":number,"macroPer100g":{"p":n,"c":n,"f":n,"b":n,"k":n}}. Numbers must be finite and non-negative. k should roughly equal p*4+c*4+f*9. No markdown.'
        }
      });

      const raw = response.text || "";
      const jsonText = raw.replace(/\\\`\\\`\\\`json|\\\`\\\`\\\`/g, "").trim();

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
`;

fs.writeFileSync('src/features/nutrition/services/estimate-macros.ts', content);
