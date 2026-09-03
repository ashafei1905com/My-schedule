
import { firestoreGetFood, firestoreSetFood } from '../../core/database/firestore.js';

export function normalizeFoodKey(raw) {
  // original logic...

  if (!raw) return '';
  return String(raw)
    .replace(/[\u064B-\u0652]/g, '')      // strip Arabic diacritics
    .replace(/[إأآ]/g, 'ا')                // unify alef forms
    .replace(/ة/g, 'ه')                    // taa marbuta -> haa
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')     // strip punctuation, keep letters/numbers
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

}
export function usdaNormalizeForScore(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export export function usdaRelevanceScoreDetailed(query, description) {
  const qTokens = new Set(usdaNormalizeForScore(query).filter(w => w.length >= 3));
  const dTokens = new Set(usdaNormalizeForScore(description));
  if (!qTokens.size) return { score: 0, overlap: 0 };
  let overlap = 0;
  for (const t of qTokens) if (dTokens.has(t)) overlap++;
  return { score: overlap / qTokens.size, overlap };
}

export export function usdaRelevanceScoreDetailed(query, description) {
  const qTokens = new Set(usdaNormalizeForScore(query).filter(w => w.length >= 3));
  const dTokens = new Set(usdaNormalizeForScore(description));
  if (!qTokens.size) return { score: 0, overlap: 0 };
  let overlap = 0;
  for (const t of qTokens) if (dTokens.has(t)) overlap++;
  return { score: overlap / qTokens.size, overlap };
}

export function usdaPickBestResult(foods, query, isIngredientLookup) {
  if (!Array.isArray(foods) || !foods.length) return null;
  const qTokenCount = usdaNormalizeForScore(query).filter(w => w.length >= 3).length;
  // Score every candidate up front — a lower-priority dataType with a much better
  // relevance score should still lose to a same-or-better-priority dataType if BOTH
  // clear the relevance floor, but a high-priority dataType with a bad relevance
  // score must not win just because Foundation/SR Legacy ranks first structurally.
  const scored = foods
    .map(f => ({ food: f, ...usdaRelevanceScoreDetailed(query, f.description) }))
    .filter(x => {
      if (x.score < USDA_RELEVANCE_MIN_SCORE) return false;
      // For RAW USER QUERIES with 2+ scoreable tokens, require at least
      // USDA_RELEVANCE_MIN_OVERLAP_COUNT actual shared tokens — not just a high
      // fraction that a short/sparse query could hit on one lucky word. A
      // single-token query (e.g. just "koshari") is exempt since it structurally
      // can never have more than 1 possible overlap. Ingredient lookups
      // (isIngredientLookup=true) skip this count check entirely — see the long
      // comment on USDA_RELEVANCE_MIN_OVERLAP_COUNT above for why.
      if (!isIngredientLookup && qTokenCount >= 2 && x.overlap < USDA_RELEVANCE_MIN_OVERLAP_COUNT) return false;
      return true;
    });
  if (!scored.length) return null; // every candidate was a loose/irrelevant match — genuine miss

  for (const dt of USDA_DATATYPE_PRIORITY) {
    const match = scored.find(x => x.food.dataType === dt);
    if (match) return match.food;
  }
  // No candidate matched a known priority dataType, but at least one cleared the
  // relevance floor — return the highest-scoring one rather than an arbitrary first.
  scored.sort((a, b) => b.score - a.score);
  return scored[0].food;
}

export function usdaExtractPer100g(food) {
  const arr = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  const get = nutrientId => {
    const entry = arr.find(n => n.nutrientId === nutrientId || n.nutrientNumber === String(nutrientId));
    return entry && typeof entry.value === 'number' ? entry.value : null;
  };
  const p = get(USDA_NUTRIENT_IDS.protein);
  const c = get(USDA_NUTRIENT_IDS.carbs);
  const f = get(USDA_NUTRIENT_IDS.fat);
  const b = get(USDA_NUTRIENT_IDS.fiber);
  const k = get(USDA_NUTRIENT_IDS.energy);
  return { p, c, f, b, k };
}

export async function usdaSearchRaw(env, query, isIngredientLookup) {
  const apiKey = env.USDA_API_KEY || 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('usda search http error', res.status, errText);
    return null;
  }
  const data = await res.json();
  const best = usdaPickBestResult(data.foods, query, isIngredientLookup);
  if (!best) return null;
  const per100g = usdaExtractPer100g(best);
  const isNum = n => typeof n === 'number' && Number.isFinite(n);
  // Core macros (protein/carbs/fat/energy) must all be present as numbers to count as
  // a usable match — fiber (b) is allowed to be missing/null since plenty of
  // legitimate USDA records simply don't report it, and the rest of this pipeline
  // already treats a missing fiber value as 0 everywhere else.
  if (!isNum(per100g.p) || !isNum(per100g.c) || !isNum(per100g.f) || !isNum(per100g.k)) return null;
  return { name: best.description || query, per100g };
}

export function needsDecomposition(query) {
  const low = query.toLowerCase();
  if (EXCLUSION_RE.test(low)) return true;
  return COMPOSITE_DISH_STEMS.some(entry => entry.stems.some(stem => low.includes(stem)));
}

export async function decomposeDish(env, query) {
  if (!env.GEMINI_API_KEY) return null;
  const sys = `You decompose a food description into its raw component ingredients with estimated gram weights, for a nutrition lookup pipeline that will fetch REAL macro data per ingredient from the USDA database — you are a parser, NOT a nutrition estimator, so never include any macro/calorie numbers yourself.

The description may be Arabic (including dialect/regional dish names) and may include exclusions ("بدون", "من غير", "without", "no X") that must be OMITTED from your ingredient list entirely.

Respond with ONLY a raw JSON object, nothing else — no markdown fences, no explanation:
{"dishNameAr":"<the dish's name in Arabic, for display>","ingredients":[{"food":"<standardized English ingredient name, USDA-searchable, e.g. 'cooked white rice'>","grams":<number>}]}

Rules:
- Use standard/typical ingredient ratios for the named dish's usual home or restaurant preparation.
- Every ingredient name must be a plain, generic, USDA-searchable English food term — no brand names, no dish names, no compound descriptions.
- Grams must be realistic component weights for a single serving (a full dish typically decomposes into 3-6 components each well under 500g).
- CRITICAL — EXCLUSIONS MUST NOT CHANGE OTHER INGREDIENTS' QUANTITIES: when the description excludes one or more ingredients ("بدون", "من غير", "without", "no X"), first mentally build the dish's STANDARD full ingredient list with standard gram weights, then simply DELETE the excluded ingredient's line(s) from that list. Do not re-derive or adjust the gram weight of any remaining ingredient because something else was removed — a koshary without onions and chickpeas still has the SAME rice, lentils, macaroni, and tomato sauce quantities as a full koshary, not a proportionally rebalanced dish. This matters because two calls for the same base dish with different exclusions must stay numerically consistent with each other on every ingredient they share — do not substitute a removed ingredient with something else either, unless the user's phrasing explicitly implies a substitution.
- If the description doesn't actually name an identifiable composite dish, respond with {"error":"<short explanation>"} instead.`;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: query,
      config: {
        systemInstruction: sys,
        responseMimeType: 'application/json'
      }
    });
    let raw = (response.text || '').trim().replace(/^\`\`\`json\s*|\`\`\`$/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return null; }
    if (parsed.error || !parsed.dishNameAr || !Array.isArray(parsed.ingredients)) return null;
    return parsed;
  } catch (e) {
    console.error('decomposeDish threw', e);
    return null;
  }
}

export async function translateToArabic(env, englishName) {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: englishName,
      config: { systemInstruction: 'Translate the given food name into short, natural Arabic. Respond with ONLY the Arabic translation, nothing else — no quotes, no explanation.' }
    });
    const ar = (response.text || '').trim();
    return ar || null;
  } catch (e) {
    console.error('translateToArabic threw', e);
    return null;
  }
}

export async function usdaNormalizeAndRetry(env, originalQuery, isIngredientLookup) {
  if (!env.GEMINI_API_KEY) return null;
  const sys = `You convert a food description (possibly Arabic, possibly informal/dialect, possibly with a quantity) into a short, standardized ENGLISH search query suitable for the USDA FoodData Central database. Respond with ONLY the search string, nothing else — no quotes, no explanation, no markdown. Keep any quantity/unit if present (e.g. "150 جرام دجاج مشوي" -> "150g grilled chicken breast"). If the description names a regional/home-cooked dish that has no direct USDA equivalent (e.g. كشري), respond with the closest generic USDA-searchable component or dish name in English rather than inventing one.`;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: originalQuery,
      config: { systemInstruction: sys }
    });
    const normalized = (response.text || '').trim();
    if (!normalized) return null;
    return await usdaSearchRaw(env, normalized, isIngredientLookup);
  } catch (e) {
    console.error('usdaNormalizeAndRetry threw', e);
    return null;
  }
}

export async function usdaLookupFood(env, query, requestedGrams) {
  if (needsDecomposition(query)) {
    const decomposed = await decomposeDish(env, query);
    if (decomposed) {
      const total = { p: 0, c: 0, f: 0, b: 0, k: 0 };
      let anyIngredientMatched = false;
      const matchedComponents = []; // exposed to the client so it can show a real
      // ingredient breakdown instead of one opaque "كشري (400g)" line — see
      // handleNutritionLookup's use of food.components below.
      for (const ing of decomposed.ingredients) {
        // Each ingredient reuses the exact single-item strategy below (raw search,
        // normalize-on-miss) — a composite dish's ingredients are themselves
        // ordinary single foods ("cooked white rice", "tomato sauce"), so there is
        // no separate lookup mechanism needed here, just recursion into the same
        // logic with requestedGrams = this ingredient's own gram weight.
        //
        // isIngredientLookup=true (the `true` argument below) skips the strict
        // minimum-overlap-COUNT gate that raw user queries need — see the long
        // comment on USDA_RELEVANCE_MIN_OVERLAP_COUNT for why a short, clean,
        // Gemini-generated ingredient name like "fried onions" structurally can never
        // satisfy a 2-token-overlap requirement against an equally short USDA
        // description, and why that requirement was silently zeroing out real
        // ingredients (the actual cause of the 310kcal koshary bug this fixes). The
        // score floor (0.5) alone still applies and still rejects genuinely wrong
        // matches for ingredients.
        const ingResult = await usdaSearchRaw(env, ing.food, true) || await usdaNormalizeAndRetry(env, ing.food, true);
        if (!ingResult) {
          console.error('decomposition ingredient had no USDA match, skipping', ing.food);
          continue; // one missing component doesn't invalidate the whole dish — sum what's verifiable
        }
        const scale = ing.grams / 100;
        const cp = ingResult.per100g.p * scale, cc = ingResult.per100g.c * scale,
              cf = ingResult.per100g.f * scale, cb = (ingResult.per100g.b || 0) * scale,
              ck = ingResult.per100g.k * scale;
        total.p += cp; total.c += cc; total.f += cf; total.b += cb; total.k += ck;
        matchedComponents.push({
          name: ingResult.name,
          qty: Math.round(ing.grams),
          unit: 'g',
          kcal: Math.round(ck),
          protein: Math.round(cp * 10) / 10,
          carbs: Math.round(cc * 10) / 10,
          fat: Math.round(cf * 10) / 10,
          fiber: Math.round(cb * 10) / 10
        });
        anyIngredientMatched = true;
      }
      if (anyIngredientMatched) {
        // The summed total represents whatever gram weight decomposeDish estimated
        // across all its ingredients — that IS the requested portion (decomposition
        // already accounts for quantity per Gemini's own estimate), so this is
        // returned as an absolute total, not re-scaled against requestedGrams like
        // the single-item path below does. A composite dish's "how much did you
        // actually eat" is inherently the whole decomposed serving, not a
        // per-100g-scalable single ingredient.
        const totalGrams = decomposed.ingredients.reduce((s, i) => s + i.grams, 0);
        return {
          name: decomposed.dishNameAr, // already Arabic — decomposeDish asked Gemini for dishNameAr directly, no separate translation call needed
          name_ar: decomposed.dishNameAr,
          protein_g: total.p,
          carbohydrates_total_g: total.c,
          fat_total_g: total.f,
          fiber_g: total.b,
          calories: total.k,
          serving_size_g: totalGrams,
          components: matchedComponents
        };
      }
      // Decomposition ran but NOT ONE ingredient resolved via USDA — fall through to
      // the single-item path below as a last resort rather than returning nothing,
      // in case the "composite dish" detection was a false positive on a query
      // that's actually closer to a single food.
    }
  }

  // ===== SINGLE-ITEM path (unchanged core logic) =====
  let result = await usdaSearchRaw(env, query);
  if (!result) {
    result = await usdaNormalizeAndRetry(env, query);
  }
  if (!result) return null;

  // If the original query was Arabic-script but USDA's matched description is
  // English (the normal case — USDA has no Arabic data), get an Arabic display name
  // so the frontend never has to show a raw English product/food name in an Arabic
  // UI. Only fires when the query actually contained Arabic script, so an
  // English-language query never pays this extra call.
  let nameAr = null;
  if (/[\u0600-\u06FF]/.test(query)) {
    nameAr = await translateToArabic(env, result.name);
  }

  // Default to a 100g reference serving if the caller didn't supply a gram-parseable
  // portion (requestedGrams is null for non-gram units like "cup"/"piece" — see
  // cacheGrams construction in handleNutritionLookup). This is NOT a guess at what
  // the user actually ate: the full query text (e.g. "1 cup rice") was already passed
  // to USDA's search / Gemini normalization above, so the food identity and rough
  // portion context were both considered upstream. 100g here only sets the baseline
  // that THIS function's numeric output is scaled/labeled against when no exact gram
  // figure is available — matching the same "can't scale reliably without a known
  // gram figure" caution already applied to tier-1 cache reads.
  const grams = (typeof requestedGrams === 'number' && requestedGrams > 0) ? requestedGrams : 100;
  const scale = grams / 100;
  return {
    name: result.name,
    name_ar: nameAr,
    protein_g: result.per100g.p * scale,
    carbohydrates_total_g: result.per100g.c * scale,
    fat_total_g: result.per100g.f * scale,
    fiber_g: (result.per100g.b || 0) * scale,
    calories: result.per100g.k * scale,
    serving_size_g: grams
  };
}

export async function tier3EstimateMacro(env, query) {
  if (!env.GEMINI_API_KEY) {
    return { ok: false, error: 'GEMINI_API_KEY not configured' };
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: query,
      config: {
        systemInstruction: TIER3_SYSTEM_PROMPT,
        responseMimeType: 'application/json'
      }
    });
    let raw = (response.text || '').trim().replace(/^\`\`\`json\s*|\`\`\`$/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return { ok: false, error: 'unparseable LLM response' }; }
    if (parsed.error) return { ok: false, error: parsed.error };

    const m = parsed.macroPer100g;
    const isFiniteNonNeg = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
    const gramsOk = isFiniteNonNeg(parsed.estimatedGrams) && parsed.estimatedGrams > 0 && parsed.estimatedGrams < 1500;
    const macroOk = m && isFiniteNonNeg(m.p) && isFiniteNonNeg(m.c) && isFiniteNonNeg(m.f) &&
                     (m.b === undefined || isFiniteNonNeg(m.b)) && isFiniteNonNeg(m.k);
    if (!gramsOk || !macroOk) {
      console.error('tier3 estimate failed validation', parsed);
      return { ok: false, error: 'implausible LLM macro estimate' };
    }
    // Same kcal/macro cross-check tier 2 already applies — a structurally "valid"
    // but internally inconsistent LLM guess (e.g. 0 protein/fat, kcal disjoint from
    // carbs) must be rejected here too, not just for API Ninjas results.
    const kcalFromMacros = m.p * 4 + m.c * 4 + m.f * 9;
    const kcalPlausible = m.k === 0 || (kcalFromMacros > 0 && Math.abs(m.k - kcalFromMacros) / Math.max(m.k, kcalFromMacros) < 0.5);
    if (!kcalPlausible) {
      console.error('tier3 estimate failed kcal cross-check', parsed);
      return { ok: false, error: 'implausible LLM macro estimate (kcal mismatch)' };
    }

    return {
      ok: true,
      canonicalName: parsed.canonicalName || query,
      macroPer100g: { p: m.p, c: m.c, f: m.f, b: m.b || 0, k: m.k },
      estimatedGrams: parsed.estimatedGrams
    };
  } catch (e) {
    console.error('tier3EstimateMacro threw', e);
    return { ok: false, error: 'Gemini request failed: ' + e.message };
  }
}

