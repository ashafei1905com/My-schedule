// Cloudflare Worker — AI proxy + Web Push backend + nutrition cache for جدول عبدالله
//
// Three responsibilities now live in this one Worker:
//   1. AI proxy (unchanged) — root path, POST — forwards chat/food-log calls to Gemini.
//   2. Web Push backend (unchanged) — /api/save-subscription (POST) stores a
//      subscription + that day's reminder schedule in D1; a per-minute Cron Trigger
//      (scheduled()) scans D1 for anything due "now" and sends real Web Push
//      notifications via Cloudflare's own infrastructure — NOT a client-side
//      setTimeout, so it is immune to iOS freezing/killing a backgrounded/closed tab.
//   3. Nutrition lookup (CHECKPOINT 1 CHANGE) — /api/nutrition (POST) now checks the
//      global Firestore /foods cache FIRST (tier 1) before falling through to the
//      existing, UNMODIFIED API Ninjas lookup (tier 2). A cache hit increments
//      usageCount and returns immediately, skipping the external API call entirely.
//      A cache miss falls through to API Ninjas exactly as before; on a successful
//      API Ninjas result, the resolved macro is written back to /foods so the next
//      lookup for the same food is a cache hit. The client-side LLM estimate
//      fallback (flEstimateMacroFallback in index.html, used when /api/nutrition
//      404s) is UNCHANGED and NOT touched in this checkpoint — that becomes tier 3,
//      moved server-side, in Checkpoint 2.
//
// Root-path behavior is 100% unchanged from before: index.html's existing
// AI_WORKER_URL POST-to-root calls (AI chat + food macro logging) work exactly as
// they did previously. Only new path behavior was added; nothing at "/" was touched.
//
// Setup (in addition to the existing GEMINI_API_KEY / API_NINJAS_KEY / VAPID secrets):
//   1. wrangler d1 create abdullah-schedule-push
//      -> paste the printed database_id into wrangler.toml
//   2. wrangler d1 execute abdullah-schedule-push --remote --file=./schema.sql
//   3. npx web-push generate-vapid-keys  (or equivalent) -> get a public+private pair
//   4. wrangler secret put VAPID_PRIVATE_KEY   (paste the PRIVATE key — never in code)
//   5. Put the PUBLIC key in wrangler.toml under [vars] VAPID_PUBLIC_KEY (safe, public
//      by design) AND in index.html's VAPID_PUBLIC_KEY constant (same string, client
//      side needs it too to call pushManager.subscribe()).
//   6. Firestore /foods cache (NEW, Checkpoint 1):
//      a. Firebase Console -> Project Settings -> Service Accounts -> "Generate new
//         private key" -> downloads a JSON file containing client_email + private_key.
//      b. wrangler secret put FIREBASE_CLIENT_EMAIL   (paste the client_email value)
//      c. wrangler secret put FIREBASE_PRIVATE_KEY    (paste the FULL private_key
//         value, including the BEGIN/END PRIVATE KEY lines — multiline secrets are
//         supported by wrangler secret put)
//      d. Add FIREBASE_PROJECT_ID = "my-schedule-10a33" to [vars] in wrangler.toml
//         (not secret — this is public info, same tier as ALLOWED_ORIGIN below)
//      e. Deploy firestore.rules (public read, zero client writes on /foods) via
//         `firebase deploy --only firestore:rules` or the Firestore Console Rules tab
//      Why not the Node Admin SDK: it depends on Node's fs/net/gRPC, none of which
//      exist in the Workers runtime even with nodejs_compat (gRPC specifically is not
//      supported). Instead this Worker signs its own Google OAuth2 JWT with WebCrypto
//      (the same signing primitive @block65/webcrypto-web-push already uses for VAPID
//      below) and talks to the plain Firestore REST API over fetch() — no SDK at all.
//   7. wrangler deploy

import { buildPushPayload } from '@block65/webcrypto-web-push';


import { handleNutritionLookup } from './src/features/nutrition/controllers/nutritionController.js';
import { handleSaveSubscription, dispatchDueReminders } from './src/features/notifications/controllers/notificationController.js';
import { handleBuildSchedule } from './src/features/schedule/controllers/scheduleController.js';
const ALLOWED_ORIGIN = '';
// Switched from llama-3.3-70b-versatile to openai/gpt-oss-120b — still 100% free on
// Gemini's no-card tier (same account, same key, zero cost change), but a newer,
// larger, production-tier model built specifically with stronger instruction-
// following and tool-use as design goals. This directly targets the observed
// failure modes: ignoring explicit rules in the food-log extraction prompt (asking
// a follow-up question when the rules said not to), and fabricating content not
// present in context (the invented "protocol" comment). A bigger, newer model
// reduces how often this happens — it does not guarantee zero, since it's still a
// free-tier call with no retry/validation loop around it.
// gpt-oss-120b spends completion tokens on internal reasoning BEFORE producing the
// visible answer, even with include_reasoning:false hiding that trace from the
// response text — the token budget still has to cover both. 600 was sized for the
// old non-reasoning Llama model's output alone and would risk truncating a reply
// before any visible text was emitted at all. Raised with headroom; reasoning_effort
// is kept at 'low' above specifically so this doesn't balloon latency or usage.
const MAX_TOKENS = 1200;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

        // ===== Build schedule from messy task list =====
    if (request.method === "POST" && url.pathname === "/api/build-schedule") {
      return handleBuildSchedule(request, env);
    }

    if (url.pathname === '/api/save-subscription') {
      return handleSaveSubscription(request, env);
    }

    if (url.pathname === '/api/nutrition') {
      return handleNutritionLookup(request, env);
    }

    // --- Everything below this line is the ORIGINAL, unmodified AI-proxy behavior ---
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const origin = request.headers.get('Origin') || '';
    if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
      return json({ error: 'Origin not allowed' }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const { messages, system } = body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages array required' }, 400);
    }
    const trimmedMessages = messages.slice(-20);

    try {
      if (!env.GEMINI_API_KEY) {
        return json({ error: 'GEMINI_API_KEY not configured' }, 503);
      }
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const geminiContents = trimmedMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      const config = {};
      if (system) config.systemInstruction = system;

      // Add search grounding for general chat (handled in root POST)
      // config.tools = [{ googleSearch: {} }];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: geminiContents,
        config
      });
      return json({ text: response.text || '' });
    } catch (e) {
      return json({ error: 'Upstream request failed: ' + e.message }, 502);
    }
  },

  // Cron Trigger entry point — configured via [triggers] crons = ["* * * * *"] in
  // wrangler.toml. Cloudflare invokes this every minute regardless of whether any
  // client has the app open at all; this is the actual fix for the iOS-background
  // problem, since delivery no longer depends on a phone's browser process existing.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatchDueReminders(env));
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// Returns 'HH:MM' (24h) and 'YYYY-MM-DD' for the current moment in Asia/Kuwait,
// matching the same timezone the client-side getKuwaitNow()/TODAY logic already uses
// — this is what keeps server-side "now" and client-side "now" in agreement, so a
// reminder computed client-side for "15:29" fires at the same real-world instant here.
function kuwaitNowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuwait',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date());
  const o = {};
  parts.forEach(p => { if (p.type !== 'literal') o[p.type] = p.value; });
  return { date: `${o.year}-${o.month}-${o.day}`, time: `${o.hour}:${o.minute}` };
}

// ===== Firestore REST client (service-account auth, no Admin SDK) =====
// Cloudflare Workers cannot run the Node Admin SDK (it needs Node's fs/net/gRPC,
// unavailable even with nodejs_compat). This talks to the plain Firestore REST API
// over fetch(), authenticated with a hand-signed Google OAuth2 JWT — the same
// WebCrypto signing approach @block65/webcrypto-web-push already uses for VAPID.
//
// Module-scope token cache: a Worker isolate can be reused across multiple requests,
// so caching the access token here (instead of re-signing a JWT and hitting Google's
// token endpoint on every single /api/nutrition call) meaningfully cuts latency and
// avoids unnecessary load on Google's OAuth endpoint. Cleared/refreshed automatically
// once within 60s of expiry.
let _fbTokenCache = { token: null, expiresAt: 0 };

function base64url(bytes) {
  let str = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Imports a PEM-formatted PKCS8 private key (exactly what Firebase's service-account
// JSON provides as `private_key`) into a WebCrypto CryptoKey usable for RS256 signing.


// Signs a Google service-account JWT and exchanges it for a short-lived OAuth2 access
// token scoped to Firestore (datastore scope covers Firestore's REST surface). Returns
// the cached token if it's still valid for at least another 60 seconds.


// Converts a plain JS value into a Firestore REST "Value" object (the REST API's
// typed-field wire format — every value must be tagged with its Firestore type).


// Converts a Firestore REST "Value" object back into a plain JS value — the inverse
// of toFirestoreValue, used when reading a cached /foods doc back out.


const FIRESTORE_BASE = env => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Fetches a single /foods/{docId} document. Returns null on a genuine 404 (cache
// miss — the normal, expected case for a food never looked up before). Throws on any
// other failure (auth misconfigured, network error, etc.) so the caller can decide
// whether to fail the request or silently fall through to tier 2 — see the try/catch
// around this call in handleNutritionLookup below.


// Writes (creates or overwrites) a /foods/{docId} document with the given plain-JS
// field map, using PATCH so this also works as an upsert. Failures here are logged
// but never thrown up to the caller — a failed cache WRITE must never fail the
// nutrition lookup itself (the client still got a correct answer from tier 2; caching
// it is a pure optimization for next time, not something worth surfacing as an error).


// Normalizes a food name into the /foods lookup key: strips Arabic diacritics, unifies
// alef forms (أ/إ/آ -> ا) and taa marbuta/haa (ة -> ه) so common spelling variants of
// the same food collide onto the same cache entry, collapses whitespace, strips
// punctuation, and lowercases (for any Latin-script portion of the query, e.g. brand
// names). This mirrors the spirit of the client's existing aiNormalize() but is
// intentionally more aggressive since this key only needs to be an internal cache
// index, never shown to a user.


// ===== TIER 3: server-side Gemini LLM estimate =====
// Reached only for items that missed BOTH tier 1 (cache) and tier 2 (API Ninjas) —
// almost always Arabic-language or regional-dish descriptions API Ninjas' English/
// Western-food-centric database has no match for. Asks the SAME Gemini account/model
// this Worker already uses for chat, with a strict JSON-only response format so the
// result can be parsed and validated deterministically, exactly like every other
// LLM-facing call in this codebase (aiResolveRelativeMove, flComputeMacro client-side
// equivalent, etc.) — never trust a raw LLM string, always parse+validate before it's
// allowed to touch macro totals or get written to the shared cache.
const TIER3_SYSTEM_PROMPT = `You are a precise nutrition estimator. You will receive a food description, possibly in Arabic (including Egyptian/Gulf/Levantine dialect or regional dish names), possibly with a quantity and unit.

Respond with ONLY a raw JSON object, nothing else — no markdown fences, no explanation outside the JSON:
{"canonicalName":"<the food's common name, in English, for internal cataloging>","macroPer100g":{"p":<protein grams per 100g, number>,"c":<carb grams per 100g, number>,"f":<fat grams per 100g, number>,"b":<fiber grams per 100g, number>,"k":<calories per 100g, number>},"estimatedGrams":<your best-estimate total gram weight of the described portion, number>}

Rules:
- macroPer100g must be a per-100g baseline for this food, NOT scaled to the described portion — estimatedGrams is what scaling happens against, separately, by the caller.
- Use standard nutritional values for the identified food. For regional/traditional dishes (e.g. كشري, ملوخية, مندي, مسخن), estimate based on typical home/restaurant preparation and standard ingredient ratios.
- estimatedGrams should reflect the quantity/unit given in the description if present (e.g. "150 جرام" -> 150), or a normal single-adult serving if no quantity was given.
- k (calories) must be consistent with p*4 + c*4 + f*9 approximately (per 100g).
- Never fabricate a food that doesn't match the description — if the description is genuinely unidentifiable, respond with {"error":"<short explanation>"} instead.`;



// ===== TIER 2: USDA FoodData Central client =====
// Replaces API Ninjas as the primary verified-macro lookup. Two structural
// differences from API Ninjas that this client has to bridge, so everything AFTER
// this point in handleNutritionLookup (validation, write-back, hadValidMatch) can
// stay completely untouched:
//   1. USDA returns nutrients as a `foodNutrients` ARRAY, each entry keyed by a
//      numeric USDA nutrient ID — not flat named fields like API Ninjas' protein_g/
//      carbohydrates_total_g/etc. USDA_NUTRIENT_IDS below maps the 5 IDs this app
//      cares about; every other nutrient USDA returns (sodium, vitamins, etc.) is
//      ignored entirely, matching what the rest of this codebase already tracks.
//   2. USDA values are per-100g for Foundation/SR Legacy foods (the preferred data
//      types below) but Branded foods carry their own servingSize/servingSizeUnit —
//      this client normalizes everything to a {p,c,f,b,k,servingG,name} shape at a
//      REQUESTED serving size, matching exactly what the existing API-Ninjas
//      validation block already expects on food.protein_g/food.serving_size_g/etc.,
//      so that block needs zero changes to accept USDA results.
const USDA_NUTRIENT_IDS = { protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, energy: 1008 };

// USDA search results mix multiple dataTypes in one response. Preference order,
// most-representative-for-a-single-generic-food first: Foundation and SR Legacy are
// USDA's own analyzed reference data (most accurate for "grilled chicken breast"-
// style generic foods); Survey (FNDDS) reflects real dietary-study consumption
// patterns; Branded is manufacturer-submitted packaged-product data, least
// representative for a home-cooked/generic meal component and used only as a last
// resort among USDA results.
const USDA_DATATYPE_PRIORITY = ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'];

// Normalizes text for relevance scoring: lowercases, strips punctuation, collapses
// whitespace. Deliberately simpler than the client's aiNormalize() (no Arabic-
// specific handling needed) since by this point every query reaching USDA has
// already been through either the original English text or Gemini normalization —
// this only ever compares English against English.


// Scores how relevant a USDA result's description is to the actual query, using the
// same token-overlap approach already proven in this codebase's client-side
// aiFindTask() fuzzy matcher. THIS is the actual fix for the koshary bug: USDA's
// search endpoint returns loosely-related results with NO relevance score of its
// own (e.g. "كشري" normalized to something USDA's free-text search fuzzy-matched
// against "CRACKER BARREL, macaroni n' cheese" — a result that shares essentially no
// real meaning with the query). Score = fraction of the QUERY's own meaningful words
// found in the result description; a low score means the result, however "valid"
// its nutrient data looks, isn't actually the food that was asked for.
//
// Returns {score, overlap} — overlap is the raw shared-token COUNT (not just the
// fraction), needed by usdaPickBestResult's minimum-overlap-count check so a sparse
// query can't pass the gate on a single lucky shared word.




// Confidence floor: below this, a USDA result is treated as NO MATCH rather than
// accepted — this is what makes a bad fuzzy match fall through to decomposition/tier
// 3 instead of silently returning wrong macros under a plausible-looking food name.
// Raised from an earlier, looser 0.34 after a production case where a single-token
// query match let an unrelated candy product ("MIDGEES") pass as a result.
const USDA_RELEVANCE_MIN_SCORE = 0.5;
// The minimum-overlap-COUNT requirement (not just fraction) exists to stop a sparse
// query hitting the score floor on ONE coincidental shared word — this matters for
// RAW USER QUERIES, which can be long, messy, Arabic-derived, or ambiguously
// normalized. It is DELIBERATELY NOT applied to decomposition ingredient lookups
// (isIngredientLookup=true below): those queries are short, clean, English food
// names generated by a controlled Gemini prompt (decomposeDish) specifically to be
// USDA-searchable — a 2-word ingredient like "fried onions" structurally can NEVER
// produce a 2-token overlap against an equally short USDA description like "Onions,
// raw" (overlap=1, correctly and unavoidably), so requiring 2 there doesn't add
// safety, it just silently drops legitimate ingredients — which is the exact
// production bug this fixes (koshary landing at 310 kcal instead of ~625 because
// rice/lentils/onions were being rejected one by one). The score floor alone (0.5)
// still protects ingredient lookups from genuinely wrong matches; it's the
// count-floor specifically that was miscalibrated for this shorter query shape.
const USDA_RELEVANCE_MIN_OVERLAP_COUNT = 2;



// Extracts {p,c,f,b,k} PER 100g from a USDA food record's foodNutrients array. USDA's
// search endpoint already reports values per 100g for Foundation/SR Legacy/Survey
// records (the standard USDA reporting basis) — Branded foods are the one dataType
// where the raw foodNutrients values may instead reflect the labeled serving rather
// than 100g, which is exactly why Branded sits last in USDA_DATATYPE_PRIORITY above
// rather than being trusted at face value for a per-100g baseline.


// Calls USDA foods/search for a single raw query string. Returns a parsed
// {name, per100g:{p,c,f,b,k}} object, or null if USDA has no usable match (empty
// results, or the best match's core macros aren't all present as numbers — a food
// record missing protein/carbs/fat/energy entirely is not a usable match regardless
// of what other nutrients it does report).


// Detects whether a query needs DECOMPOSITION rather than a single-item lookup:
// either explicit exclusion language ("بدون"/"without"/"no X"), which USDA has no
// concept of at all, or the query matching a known composite/regional dish that is
// structurally made of several distinct components USDA would never have as one
// single food record.
//
// STEM-PREFIX matching, not exact-substring: the query reaching this function has
// already been through flExtractMealInfo's client-side English transliteration
// (Gemini's own free choice of spelling, e.g. "koshari" vs "koshary" vs "kushari" vs
// "kosheri" — all real, all seen in production for the same dish), so a fixed list
// of exact spellings will always have gaps no matter how many variants are added —
// that was the actual root cause of the "MIDGEES"/"Koshari (400g)" bypass: the
// specific spelling Gemini chose ("koshari") simply wasn't one of the three variants
// hardcoded at the time. Matching on a short STEM (e.g. "kosh"/"kush" — the shared
// first syllable across every real spelling of this dish) instead of the whole word
// absorbs any vowel-spelling variant without needing to enumerate every one.
const COMPOSITE_DISH_STEMS = [
  { stems: ['كشري', 'كوشري', 'kosh', 'kush'], label: 'koshary' },
  { stems: ['كبس', 'kabs'], label: 'kabsa' },
  { stems: ['مندي', 'mandi', 'mendi'], label: 'mandi' },
  { stems: ['ملوخي', 'moloukh', 'molokh'], label: 'molokhia' },
  { stems: ['فت ', 'فتة', 'fattah', 'fatteh'], label: 'fatta' },
  { stems: ['بيتزا', 'pizza'], label: 'pizza' },
  { stems: ['ساندوتش', 'ساندويتش', 'sandwich', 'sandwitch'], label: 'sandwich' },
  { stems: ['برجر', 'burger', 'burgur'], label: 'burger' }
];
const EXCLUSION_RE = /بدون|من غير|without\b|\bno\s+\w/i;



// Asks Gemini to decompose a composite dish (or a dish with stated exclusions) into
// raw, standardized English ingredient lines with gram weights — explicitly as a
// PARSER, not an estimator: Gemini never supplies macro numbers here, only identifies
// and quantifies ingredients. Every gram of actual nutrition data still comes from
// USDA per-ingredient lookups afterward, keeping "verified macros" true even for
// composite dishes. Strict JSON-only response, validated before use — same
// discipline as every other LLM-facing call in this codebase.




// Uses Gemini to turn a possibly-Arabic or otherwise USDA-unparseable query into a
// clean, standardized English search string (e.g. "150 جرام دجاج مشوي" ->
// "grilled chicken breast"), then retries USDA once with that normalized text. This
// is the "normalize-on-miss" step — only ever called after a raw USDA search already
// came back empty, so ordinary English queries never pay this extra round trip.


// Top-level tier-2 entry point. Branches into one of two strategies:
//   - DECOMPOSITION (composite dishes / exclusions, e.g. "كشري بدون بصل"): Gemini
//     decomposes into raw ingredients+grams (never supplying macros itself), each
//     ingredient gets its own single-item USDA lookup (raw+normalize, same as
//     below), and the results are summed. This is what actually fixes the koshary
//     bug — no single USDA record is ever asked to represent a composite dish, so
//     the relevance gate in usdaPickBestResult never has to choose between "reject
//     everything" and "accept a loose fuzzy match" for a dish USDA was never going
//     to have as one entry.
//   - SINGLE-ITEM (everything else): raw USDA search, normalize-and-retry only on a
//     miss — UNCHANGED from before, since this path is already confirmed working
//     correctly by both the English and single-item Arabic test cases.
// Returns the SAME shape handleNutritionLookup's existing validation block already
// expects (protein_g/carbohydrates_total_g/fat_total_g/fiber_g/calories/
// serving_size_g/name[/name_ar]), scaled to the item's requested grams — this is
// what lets that block stay completely unmodified below, for BOTH strategies.


// ===== /api/nutrition =====
// Real nutrition lookup — API Ninjas Nutrition API. This is the platform CalorieNinjas
// itself migrated into during 2025 (CalorieNinjas' free public signup is closed; the
// same underlying food database and natural-language parsing now live here), and its
// free tier is generous enough for this app's volume with no credit card required.
//
// Replaces AI-guessed macros entirely: the client sends already-clarified
// {food, qty, unit} items (see flExtractMealInfo in index.html), this Worker queries
// API Ninjas per item with the app's key kept server-side (never exposed to the
// client, same pattern as GEMINI_API_KEY), and returns real measured totals.
//
// Setup:
//   1. Sign up free at https://api-ninjas.com/register (no credit card required).
//   2. Copy your API key from the dashboard (https://api-ninjas.com/profile).
//   3. wrangler secret put API_NINJAS_KEY
//   4. wrangler deploy
//
// Body shape: { items: [{food, qty, unit}, ...] }  OR  { query: "<free text>" } —
// both accepted; `items` is preferred (built from the AI extraction step) since it
// lets each item be queried individually, which is more reliable against API
// Ninjas' parser than one long comma-joined multi-item string.
// Response: { macro: {p,c,f,b,k}, items: [{name, qty, unit, kcal}, ...] }


// ===== /api/save-subscription =====
// Body shape (sent by index.html):
// {
//   uid: "<firebase user uid>",
//   subscription: { endpoint, keys: { p256dh, auth } },   // from pushManager.subscribe()
//   reminders: [ { taskId, taskName, type:'lead'|'start'|'ending', date:'YYYY-MM-DD', time:'HH:MM' }, ... ]
// }
//
// Called once per app load (and whenever today's task list changes) with the FULL set
// of reminders for the currently-loaded day — not a diff. Old rows for this user+date
// are deleted and replaced wholesale each call; this is simpler and cheap enough at
// this data volume, and avoids stale-row bugs a partial/diff update could introduce.


// ===== Cron: dispatch due reminders =====
// Called every minute. Finds every scheduled_reminders row DUE (at or before the
// current Kuwait time) that hasn't fired yet, sends a Web Push notification for each,
// and marks it fired. Dead subscriptions (410 Gone / 404) are cleaned up so they
// stop being retried on every future minute.
//
// FIXED BUG: this used to match fire_time with exact equality (WHERE fire_time = ?).
// Cloudflare Cron Triggers are explicitly documented as best-effort — they typically
// fire within the minute but are NOT guaranteed to land on the exact :00 second, and
// under load can occasionally skip or shift by a minute. With an exact-time match,
// any reminder whose minute the cron didn't land on exactly was permanently missed —
// fired stayed 0 forever, and the one minute that would have matched it never came
// back around. This is the actual root cause of "used to get notifications, just not
// perfectly on time, now I get none at all" — the miss rate compounds silently over
// time with zero visible symptom until it's total. Fixed by matching everything due
// AT OR BEFORE now (fire_time <= current), bounded to a 30-minute lookback window so
// a very old missed reminder doesn't fire hours late, but a same-cycle miss now
// self-heals on the very next minute's cron run instead of being lost forever.
