
import { json, corsHeaders } from '../../../core/utils/response.js';
import { normalizeFoodKey, tier3EstimateMacro, usdaLookupFood } from '../services/nutritionService.js';
import { firestoreGetFood, firestoreSetFood } from '../../../core/database/firestore.js';

export async function handleNutritionLookup(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  // NOTE: API_NINJAS_KEY is no longer required — tier 2 is now USDA FoodData Central
  // (see usdaLookupFood above), which falls back to the public 'DEMO_KEY' if
  // env.USDA_API_KEY isn't set, per explicit instruction. Left un-guarded here
  // deliberately: a missing USDA_API_KEY should degrade to DEMO_KEY's lower rate
  // limit, not hard-fail every request the way a missing API_NINJAS_KEY used to.

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Build one query string PER item so each gets parsed independently — API Ninjas'
  // free-text parser handles "200g grilled chicken breast" reliably on its own, but
  // is noticeably less reliable when several unrelated items are comma-joined into
  // one query. Falls back to a single combined query if the caller only sent a raw
  // "query" string (e.g. from an older client build) rather than structured items.
  //
  // cacheKeys runs parallel to queries — cacheKeys[i] is the normalized /foods lookup
  // key for queries[i]'s food name specifically (not the full "qty unit food" string,
  // since qty/unit vary per-log but the underlying food identity doesn't — caching by
  // food name alone is what makes repeat logs of the same food, at different
  // portions, all hit the same cache entry).
  let queries, cacheKeys, cacheGrams;
  if (Array.isArray(body.items) && body.items.length) {
    queries = body.items.map(it => `${it.qty} ${it.unit} ${it.food}`.trim());
    cacheKeys = body.items.map(it => normalizeFoodKey(it.food));
    // Cached macros are stored per-100g (see write-back below), so a cache hit can
    // ONLY be scaled correctly when the requested portion is expressible in grams.
    // A gram-ambiguous unit ("cup", "piece", "tbsp") is left as null here, which
    // forces that item to skip tier 1 and fall through to API Ninjas — API Ninjas'
    // own free-text parser already handles those units correctly, and guessing a
    // gram-conversion here risks silently wrong macros, which is worse than one extra
    // external call.
    cacheGrams = body.items.map(it => {
      const unit = String(it.unit || '').trim().toLowerCase();
      const qty = parseFloat(it.qty);
      if (!Number.isFinite(qty) || qty <= 0) return null;
      if (unit === 'g' || unit === 'gram' || unit === 'grams' || unit === 'جم' || unit === 'جرام') return qty;
      return null;
    });
  } else if (body.query && String(body.query).trim()) {
    // A raw free-text query has no structured qty/unit, so it can never be a TIER 1
    // read hit (macroPer100g scaling requires a known gram figure — see cacheGrams
    // logic above) and always routes to tier 2 first (API Ninjas' own parser handles
    // free text natively). It CAN still benefit from TIER 3 write-back, though —
    // Gemini estimates its own gram figure from the description, so a normalized key
    // for the whole query string is set here purely for that write-back path (tier 1
    // read logic above still requires cacheGrams to be non-null, so this key is
    // simply never consulted for a read on this path — only used if tier 3 fires).
    queries = [String(body.query).trim()];
    cacheKeys = [normalizeFoodKey(body.query)];
    cacheGrams = [null];
  } else {
    return json({ error: 'items or query required' }, 400);
  }

  try {
    const macro = { p: 0, c: 0, f: 0, b: 0, k: 0 };
    const items = [];
    let anyMatched = false;
    // Tracks items that fell through BOTH tier 1 (cache) and tier 2 (API Ninjas) —
    // these get one attempt at tier 3 (Gemini) below, rather than only falling back to
    // the LLM when the entire batch comes back empty. This matters for mixed-language
    // meals: "200g chicken + ١٥٠ جرام رز" should resolve chicken via API Ninjas AND
    // rice via Gemini in the SAME request, not silently drop the rice because chicken
    // alone was enough to make anyMatched true.
    const tier3Candidates = []; // { qi, q, cacheKey }

    for (let qi = 0; qi < queries.length; qi++) {
      const q = queries[qi];
      const cacheKey = cacheKeys[qi];
      const grams = cacheGrams[qi];

      // ===== TIER 1: /foods cache =====
      // Only attempted when the requested portion is expressible in grams (see
      // cacheGrams construction above) — cached macros are stored per-100g, and that
      // gram figure is what lets a hit be scaled correctly to THIS request's actual
      // portion, rather than reusing whatever portion happened to be logged the first
      // time this food was cached.
      //
      // A cache miss, or any error reaching Firestore (misconfigured secrets, network
      // blip, etc.), falls straight through to tier 2 (API Ninjas) below — caching is
      // purely an optimization layer in front of the existing, already-working
      // lookup, and must never be able to make a request fail that would have
      // succeeded without it.
      if (cacheKey && grams) {
        try {
          const cached = await firestoreGetFood(env, cacheKey);
          if (cached && cached.macroPer100g) {
            const m = cached.macroPer100g;
            const isNum = n => typeof n === 'number' && Number.isFinite(n);
            if (isNum(m.p) && isNum(m.c) && isNum(m.f) && isNum(m.k)) {
              const scale = grams / 100;
              const sp = m.p * scale, sc = m.c * scale, sf = m.f * scale, sb = (m.b || 0) * scale, sk = m.k * scale;
              macro.p += sp; macro.c += sc; macro.f += sf; macro.b += sb; macro.k += sk;
              items.push({
                name: cached.canonicalName || q,
                name_ar: cached.canonicalNameAr || null,
                qty: grams,
                unit: 'g',
                kcal: Math.round(sk),
                protein: Math.round(sp * 10) / 10,
                carbs: Math.round(sc * 10) / 10,
                fat: Math.round(sf * 10) / 10,
                fiber: Math.round(sb * 10) / 10,
                rejected: false,
                source: cached.source || 'cache'
              });
              anyMatched = true;
              // Fire-and-forget usage counter bump — must not block or fail the
              // response if it errors, so it's deliberately not awaited into the
              // main try/catch's failure path.
              firestoreSetFood(env, cacheKey, { usageCount: (cached.usageCount || 0) + 1, updatedAt: Date.now() })
                .catch(e => console.error('usageCount bump failed', e));
              continue; // skip tier 2 entirely for this item — cache hit
            }
          }
        } catch (e) {
          console.error('foods cache lookup failed, falling through to API Ninjas', e);
        }
      }

      // ===== TIER 2: USDA FoodData Central (replaces API Ninjas) =====
      // usdaLookupFood already does raw-search-then-normalize-on-miss internally (see
      // usdaLookupFood/usdaNormalizeAndRetry above) and returns the SAME field shape
      // API Ninjas used to (protein_g/carbohydrates_total_g/fat_total_g/fiber_g/
      // calories/serving_size_g/name) — wrapped in a single-element array so every
      // line of the validation/write-back loop below runs completely unmodified,
      // exactly as it did against API Ninjas' `foods` array.
      const cacheGramsForQi = cacheGrams[qi];
      let foods;
      try {
        const usdaFood = await usdaLookupFood(env, q, cacheGramsForQi);
        foods = usdaFood ? [usdaFood] : null;
      } catch (e) {
        console.error('usda lookup threw', e);
        foods = null;
      }

      if (!foods || !foods.length) {
        // USDA (raw + normalized retry) had no usable match at all — the common case
        // for regional/home-cooked dishes with no USDA equivalent (e.g. كشري). Queue
        // for tier 3 instead of dropping.
        tier3Candidates.push({ qi, q, cacheKey });
        continue;
      }

      let hadValidMatch = false;
      for (const food of foods) {
        // Hard validation: every field must be a finite, non-negative number, and
        // serving size must be plausible (a single logged food is never 10,000+
        // grams). A food entry that fails this is skipped entirely rather than
        // silently contributing NaN/garbage to the running total — this is the
        // actual fix for "3089g carbs, 0 protein" style impossible results.
        //
        // Tightened from <5000g to <1500g per item: a single realistically-logged
        // food item (one meal component, not a whole day's intake) essentially never
        // legitimately weighs more than ~1.5kg. The earlier 5000g ceiling was wide
        // enough to let a misparsed API Ninjas match (e.g. the query resolving to a
        // bulk/wrong database entry) straight through, which is what produced the
        // 3088g-carbs result even after "validation" — every individual field was
        // still technically finite and non-negative, so it passed.
        const isFiniteNonNeg = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
        const p = food.protein_g, c = food.carbohydrates_total_g, f = food.fat_total_g,
              b = food.fiber_g, k = food.calories, servingG = food.serving_size_g;
        const fieldsValid = isFiniteNonNeg(p) && isFiniteNonNeg(c) && isFiniteNonNeg(f) &&
                             (b===undefined || isFiniteNonNeg(b)) && isFiniteNonNeg(k) &&
                             (servingG===undefined || (isFiniteNonNeg(servingG) && servingG < 1500));
        // Sanity cross-check: calories should roughly match p*4 + c*4 + f*9 (within a
        // generous tolerance for rounding/alcohol/etc.) — catches a field-mapping or
        // scale bug even when every individual field looked numerically "valid".
        const kcalFromMacros = p*4 + c*4 + f*9;
        const kcalPlausible = k===0 || (kcalFromMacros>0 && Math.abs(k-kcalFromMacros)/Math.max(k,kcalFromMacros) < 0.5);
        if (!fieldsValid || !kcalPlausible) {
          console.error('nutrition item failed validation, skipping', { query: q, food });
          items.push({
            name: food.name || q,
            qty: servingG,
            unit: 'g',
            kcal: null,
            rejected: true,
            rejectReason: !fieldsValid ? 'implausible_serving_or_field' : 'kcal_macro_mismatch'
          });
          continue;
        }
        hadValidMatch = true;
        macro.p += p; macro.c += c; macro.f += f; macro.b += (b||0); macro.k += k;
        items.push({
          name: food.name,
          name_ar: food.name_ar || null,
          qty: servingG,
          unit: 'g',
          kcal: Math.round(k),
          protein: Math.round(p*10)/10,
          carbs: Math.round(c*10)/10,
          fat: Math.round(f*10)/10,
          fiber: Math.round((b||0)*10)/10,
          rejected: false,
          // Only present for composite dishes resolved via decomposeDish (see
          // usdaLookupFood) — lets the client show the real matched ingredient
          // breakdown (e.g. Rice, Lentils, Macaroni, Tomato Sauce) instead of
          // collapsing everything into one opaque "كشري (400g)" line. Absent
          // (undefined) for ordinary single-item matches, exactly as before.
          components: food.components || undefined
        });
        anyMatched = true;

        // ===== Tier-1 write-back =====
        // Cache this validated result under this item's normalized food-name key so
        // the NEXT lookup for the same food (any portion size) is a tier-1 hit and
        // skips API Ninjas entirely. Deliberately fire-and-forget (not awaited into
        // the main flow) — per the same rule as the usageCount bump above, a caching
        // failure must never turn an already-successful nutrition lookup into an
        // error response for the user. Only caches per-100g-normalized macros derived
        // from this specific serving, scaled by servingG, so future lookups at
        // different portions compute correctly off a consistent per-100g baseline.
        if (cacheKey && servingG > 0) {
          const scale = 100 / servingG;
          firestoreSetFood(env, cacheKey, {
            canonicalName: food.name || q,
            canonicalNameAr: food.name_ar || null,
            normalizedKey: cacheKey,
            macroPer100g: {
              p: Math.round(p * scale * 10) / 10,
              c: Math.round(c * scale * 10) / 10,
              f: Math.round(f * scale * 10) / 10,
              b: Math.round((b || 0) * scale * 10) / 10,
              k: Math.round(k * scale * 10) / 10
            },
            source: 'external_api_cache',
            confidence: 'medium',
            usageCount: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }).catch(e => console.error('write-back cache failed', e));
        }
      }

      // API Ninjas returned one or more `food` entries for this query, but every
      // single one failed validation (e.g. the API Ninjas paywall-string case seen
      // in production: calories/protein_g returned as the literal string "Only
      // available for premium subscribers." instead of a number, which fieldsValid
      // correctly rejects). This is a genuine tier-2 miss just like an empty result
      // set — queue it for tier 3 exactly once for this qi, rather than leaving it to
      // silently fall out as a 404 with no fallback attempted.
      if (!hadValidMatch) {
        tier3Candidates.push({ qi, q, cacheKey });
      }
    }

    // ===== TIER 3: Gemini LLM estimate =====
    // Runs once per item that missed both tier 1 and tier 2 — not inside the main
    // loop, so a slow/failed Gemini call for one item never blocks or reorders the
    // synchronous API Ninjas calls for the others. Marked confidence:'low' on
    // write-back (per the original architecture doc) so a future admin review queue
    // can prioritize verifying these over external_api_cache entries.
    for (const cand of tier3Candidates) {
      const est = await tier3EstimateMacro(env, cand.q);
      if (!est.ok) {
        console.error('tier3 miss for', cand.q, est.error);
        continue; // genuinely unresolvable — falls out of the response entirely, same as any other total miss
      }
      const scale = est.estimatedGrams / 100;
      const sp = est.macroPer100g.p * scale, sc = est.macroPer100g.c * scale,
            sf = est.macroPer100g.f * scale, sb = est.macroPer100g.b * scale, sk = est.macroPer100g.k * scale;
      macro.p += sp; macro.c += sc; macro.f += sf; macro.b += sb; macro.k += sk;
      items.push({
        name: est.canonicalName,
        qty: Math.round(est.estimatedGrams),
        unit: 'g',
        kcal: Math.round(sk),
        protein: Math.round(sp * 10) / 10,
        carbs: Math.round(sc * 10) / 10,
        fat: Math.round(sf * 10) / 10,
        fiber: Math.round(sb * 10) / 10,
        rejected: false,
        source: 'ai_estimate',
        estimated: true // client can show the existing "تقريبي" badge off this flag
      });
      anyMatched = true;

      // Write-back to /foods, same shape and same fire-and-forget policy as the
      // tier-2 write-back above — a caching failure must never fail an otherwise-
      // successful lookup. confidence:'low' (vs tier 2's 'medium') is the one
      // deliberate difference, flagging these for eventual admin review.
      if (cand.cacheKey) {
        firestoreSetFood(env, cand.cacheKey, {
          canonicalName: est.canonicalName,
          normalizedKey: cand.cacheKey,
          macroPer100g: {
            p: Math.round(est.macroPer100g.p * 10) / 10,
            c: Math.round(est.macroPer100g.c * 10) / 10,
            f: Math.round(est.macroPer100g.f * 10) / 10,
            b: Math.round(est.macroPer100g.b * 10) / 10,
            k: Math.round(est.macroPer100g.k * 10) / 10
          },
          source: 'ai_estimate',
          confidence: 'low',
          usageCount: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }).catch(e => console.error('tier3 write-back cache failed', e));
      }
    }

    if (!anyMatched) {
      return json({ error: 'No matching foods found' }, 404);
    }

    const anyRejected = items.some(it => it.rejected);
    const r1 = n => Math.round(n * 10) / 10;
    return json({
      macro: { p: r1(macro.p), c: r1(macro.c), f: r1(macro.f), b: r1(macro.b), k: r1(macro.k) },
      items,
      anyRejected
    });
  } catch (e) {
    console.error('nutrition lookup request failed', e);
    return json({ error: 'Upstream nutrition request failed: ' + e.message }, 502);
  }
}
