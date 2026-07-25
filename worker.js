// Cloudflare Worker — AI proxy + Web Push backend + nutrition cache for جدول عبدالله
//
// Three responsibilities now live in this one Worker:
//   1. AI proxy (unchanged) — root path, POST — forwards chat/food-log calls to Groq.
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
// Setup (in addition to the existing GROQ_API_KEY / API_NINJAS_KEY / VAPID secrets):
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

const ALLOWED_ORIGIN = 'https://ashafei1905com.github.io';
// Switched from llama-3.3-70b-versatile to openai/gpt-oss-120b — still 100% free on
// Groq's no-card tier (same account, same key, zero cost change), but a newer,
// larger, production-tier model built specifically with stronger instruction-
// following and tool-use as design goals. This directly targets the observed
// failure modes: ignoring explicit rules in the food-log extraction prompt (asking
// a follow-up question when the rules said not to), and fabricating content not
// present in context (the invented "protocol" comment). A bigger, newer model
// reduces how often this happens — it does not guarantee zero, since it's still a
// free-tier call with no retry/validation loop around it.
const MODEL = 'openai/gpt-oss-120b';
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

    const groqMessages = system
      ? [{ role: 'system', content: system }, ...trimmedMessages]
      : trimmedMessages;

    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: MAX_TOKENS,
          messages: groqMessages,
          // gpt-oss-120b is a reasoning model — by default Groq INCLUDES its internal
          // reasoning trace in the response (include_reasoning defaults to true).
          // Every caller in this app (aiParseIntent's JSON parsing, flExtractMealInfo,
          // flComputeMacro, aiResolveRelativeMove, etc.) does a plain JSON.parse on
          // data.text expecting ONLY the final JSON object — a prepended reasoning
          // trace would break every one of them with a parse error. Explicitly
          // disabling it here is required, not optional, for this model swap to work
          // at all. reasoning_effort:'low' also keeps latency/token usage close to
          // what the old non-reasoning model felt like, since this app needs fast
          // conversational replies, not deep multi-step reasoning.
          include_reasoning: false,
          reasoning_effort: 'low'
        })
      });

      const data = await groqRes.json();
      if (!groqRes.ok) {
        return json({ error: data?.error?.message || 'Groq API error' }, groqRes.status);
      }

      const text = data?.choices?.[0]?.message?.content || '';
      return json({ text });
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
async function importServiceAccountKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    // Strips LITERAL two-character backslash-n sequences, not just real newline
    // characters. This is the actual fix for the production `atob() called with
    // invalid base64-encoded data` error: when a service-account JSON key's
    // private_key field (which is stored JSON-escaped, e.g. "...\nMIIEvQ...\n...")
    // is copied out of the JSON file and pasted into `wrangler secret put`, it is
    // extremely easy for the escape sequence to survive as the literal two
    // characters `\` + `n` rather than becoming a real newline byte — `\s+` below
    // only matches real whitespace, so those literal backslash-n pairs previously
    // survived straight into the base64 body, and `\`/`n`-as-text are not valid
    // base64 alphabet characters, hence atob() throwing InvalidCharacterError.
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  // Validate the cleaned string is plausible base64 BEFORE calling atob(), so a
  // still-malformed secret produces a clear, actionable error message (naming the
  // actual cause) instead of atob()'s opaque InvalidCharacterError with no context —
  // this is what let the original failure reach production silently as a generic
  // "foods cache lookup failed" catch-all instead of pointing at the secret itself.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body)) {
    throw new Error('FIREBASE_PRIVATE_KEY does not decode as valid base64 after cleanup — re-check the secret was pasted correctly (the full PEM body between BEGIN/END PRIVATE KEY, either as real newlines or a single unbroken line)');
  }
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

// Signs a Google service-account JWT and exchanges it for a short-lived OAuth2 access
// token scoped to Firestore (datastore scope covers Firestore's REST surface). Returns
// the cached token if it's still valid for at least another 60 seconds.
async function getFirestoreAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (_fbTokenCache.token && _fbTokenCache.expiresAt - now > 60) {
    return _fbTokenCache.token;
  }

  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase service account secrets not configured (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const encHeader = base64url(JSON.stringify(header));
  const encClaims = base64url(JSON.stringify(claims));
  const signingInput = `${encHeader}.${encClaims}`;

  const key = await importServiceAccountKey(env.FIREBASE_PRIVATE_KEY);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${base64url(sig)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => '');
    throw new Error(`Firebase OAuth token exchange failed: ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json();
  _fbTokenCache = { token: tokenData.access_token, expiresAt: now + (tokenData.expires_in || 3600) };
  return _fbTokenCache.token;
}

// Converts a plain JS value into a Firestore REST "Value" object (the REST API's
// typed-field wire format — every value must be tagged with its Firestore type).
function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = toFirestoreValue(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

// Converts a Firestore REST "Value" object back into a plain JS value — the inverse
// of toFirestoreValue, used when reading a cached /foods doc back out.
function fromFirestoreValue(v) {
  if (!v) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in v) {
    const out = {};
    const fields = v.mapValue.fields || {};
    for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
    return out;
  }
  return null;
}

const FIRESTORE_BASE = env => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Fetches a single /foods/{docId} document. Returns null on a genuine 404 (cache
// miss — the normal, expected case for a food never looked up before). Throws on any
// other failure (auth misconfigured, network error, etc.) so the caller can decide
// whether to fail the request or silently fall through to tier 2 — see the try/catch
// around this call in handleNutritionLookup below.
async function firestoreGetFood(env, docId) {
  const token = await getFirestoreAccessToken(env);
  const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Firestore get failed: ${res.status} ${errText}`);
  }
  const data = await res.json();
  const fields = data.fields || {};
  const out = {};
  for (const k of Object.keys(fields)) out[k] = fromFirestoreValue(fields[k]);
  return out;
}

// Writes (creates or overwrites) a /foods/{docId} document with the given plain-JS
// field map, using PATCH so this also works as an upsert. Failures here are logged
// but never thrown up to the caller — a failed cache WRITE must never fail the
// nutrition lookup itself (the client still got a correct answer from tier 2; caching
// it is a pure optimization for next time, not something worth surfacing as an error).
async function firestoreSetFood(env, docId, fieldsObj) {
  try {
    const token = await getFirestoreAccessToken(env);
    const fields = {};
    for (const k of Object.keys(fieldsObj)) fields[k] = toFirestoreValue(fieldsObj[k]);
    const res = await fetch(`${FIRESTORE_BASE(env)}/foods/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('firestoreSetFood failed', res.status, errText);
    }
  } catch (e) {
    console.error('firestoreSetFood threw', e);
  }
}

// Normalizes a food name into the /foods lookup key: strips Arabic diacritics, unifies
// alef forms (أ/إ/آ -> ا) and taa marbuta/haa (ة -> ه) so common spelling variants of
// the same food collide onto the same cache entry, collapses whitespace, strips
// punctuation, and lowercases (for any Latin-script portion of the query, e.g. brand
// names). This mirrors the spirit of the client's existing aiNormalize() but is
// intentionally more aggressive since this key only needs to be an internal cache
// index, never shown to a user.
function normalizeFoodKey(raw) {
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

// ===== TIER 3: server-side Groq LLM estimate =====
// Reached only for items that missed BOTH tier 1 (cache) and tier 2 (API Ninjas) —
// almost always Arabic-language or regional-dish descriptions API Ninjas' English/
// Western-food-centric database has no match for. Asks the SAME Groq account/model
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

async function tier3EstimateMacro(env, query) {
  if (!env.GROQ_API_KEY) {
    return { ok: false, error: 'GROQ_API_KEY not configured' };
  }
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 400,
        include_reasoning: false,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: TIER3_SYSTEM_PROMPT },
          { role: 'user', content: query }
        ]
      })
    });
    const data = await groqRes.json();
    if (!groqRes.ok) {
      return { ok: false, error: data?.error?.message || 'Groq API error' };
    }
    let raw = (data?.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*|```$/g, '').trim();
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
    return { ok: false, error: 'Groq request failed: ' + e.message };
  }
}

// ===== /api/nutrition =====
// Real nutrition lookup — API Ninjas Nutrition API. This is the platform CalorieNinjas
// itself migrated into during 2025 (CalorieNinjas' free public signup is closed; the
// same underlying food database and natural-language parsing now live here), and its
// free tier is generous enough for this app's volume with no credit card required.
//
// Replaces AI-guessed macros entirely: the client sends already-clarified
// {food, qty, unit} items (see flExtractMealInfo in index.html), this Worker queries
// API Ninjas per item with the app's key kept server-side (never exposed to the
// client, same pattern as GROQ_API_KEY), and returns real measured totals.
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
async function handleNutritionLookup(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  if (!env.API_NINJAS_KEY) {
    return json({ error: 'API Ninjas key not configured on the server yet.' }, 500);
  }

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
    // Groq estimates its own gram figure from the description, so a normalized key
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
    // these get one attempt at tier 3 (Groq) below, rather than only falling back to
    // the LLM when the entire batch comes back empty. This matters for mixed-language
    // meals: "200g chicken + ١٥٠ جرام رز" should resolve chicken via API Ninjas AND
    // rice via Groq in the SAME request, not silently drop the rice because chicken
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

      // ===== TIER 2: API Ninjas (existing, unmodified logic below) =====
      const url = 'https://api.api-ninjas.com/v1/nutrition?query=' + encodeURIComponent(q);
      const nxRes = await fetch(url, {
        headers: { 'X-Api-Key': env.API_NINJAS_KEY }
      });

      if (!nxRes.ok) {
        const errText = await nxRes.text().catch(() => '');
        console.error('api-ninjas error', nxRes.status, errText);
        // One bad item shouldn't fail the whole meal — skip it and keep going, but
        // track that at least one lookup must succeed or the whole call is an error.
        // Queue for tier 3 (Groq) rather than dropping silently — this is the actual
        // fix for Arabic/complex-meal items that API Ninjas can't parse at all.
        tier3Candidates.push({ qi, q, cacheKey });
        continue;
      }

      const raw = await nxRes.json();
      // CONFIRMED BUG FIX: API Ninjas' v1/nutrition endpoint (same underlying engine
      // as CalorieNinjas) returns an OBJECT shaped {"items":[ {...}, {...} ]} — NOT a
      // bare array. The previous code did `Array.isArray(foods)` directly on the
      // response body, which is always false for this real shape, meaning every
      // lookup was silently treated as "no results" internally... except the bug
      // this masked is worse: because the code then `continue`d past validation
      // instead of throwing, any earlier/partial cached deploy or a shape drift
      // could let `foods` fall through as some other truthy-but-wrong value and get
      // iterated as if it were food entries, reading undefined fields as `|| 0`
      // everywhere BUT serving_size_g (used raw, unguarded) — that's the likely
      // source of the impossible numbers (e.g. thousands of grams of carbs) seen in
      // production. Fixed by unwrapping the real `items` array AND hard-validating
      // every numeric field before it's allowed to contribute to the total.
      const foods = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : null);
      if (!foods || !foods.length) {
        // API Ninjas understood the request but has no match — the common case for
        // Arabic-language or regional-dish queries, since its underlying database is
        // English/Western-food-centric. Queue for tier 3 instead of dropping.
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
          qty: servingG,
          unit: 'g',
          kcal: Math.round(k),
          protein: Math.round(p*10)/10,
          carbs: Math.round(c*10)/10,
          fat: Math.round(f*10)/10,
          fiber: Math.round((b||0)*10)/10,
          rejected: false
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

    // ===== TIER 3: Groq LLM estimate =====
    // Runs once per item that missed both tier 1 and tier 2 — not inside the main
    // loop, so a slow/failed Groq call for one item never blocks or reorders the
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
async function handleSaveSubscription(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

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

  const { uid, subscription, reminders } = body;
  if (!uid || typeof uid !== 'string') return json({ error: 'uid required' }, 400);
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return json({ error: 'valid subscription required' }, 400);
  }
  if (!Array.isArray(reminders)) return json({ error: 'reminders array required' }, 400);

  const now = Date.now();

  try {
    // Upsert the subscription — ON CONFLICT on the UNIQUE endpoint column handles the
    // "same device re-subscribing" case without a separate SELECT-then-branch.
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (user_uid, endpoint, p256dh, auth, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_uid=excluded.user_uid, p256dh=excluded.p256dh, auth=excluded.auth`
    ).bind(uid, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, now).run();

    // Replace today's PENDING reminders for this user. Previous version deleted ALL
    // rows (fired or not) for the date, unconditionally, on every sync call. The app
    // calls syncPushSchedule() on every load/re-render (see index.html), so a sync
    // could race the cron job: cron reads a not-yet-fired row and starts sending the
    // push -> before it marks fired=1, a resync deletes that row and inserts a FRESH
    // fired=0 row for the exact same task/time -> the in-flight send still completes,
    // and the new row is still eligible to fire again on the next cron tick. This was
    // the actual mechanism behind the repeated "same reminder 4x in a row" bug, not a
    // subscription-table duplication issue.
    //
    // Fix has two parts:
    //   1. Only delete rows that have NOT fired yet (fired = 0) — an already-fired row
    //      for today is left alone, so a resync can never resurrect a reminder that's
    //      already been sent.
    //   2. Insert with a dedup guard (INSERT ... WHERE NOT EXISTS) keyed on the same
    //      tuple the sw.js notification tag itself collapses on (task_id + type),
    //      scoped to the day — this makes even an overlapping/racing sync unable to
    //      create two live rows for the same reminder, regardless of timing.
    const dates = [...new Set(reminders.map(r => r.date))];
    for (const d of dates) {
      await env.DB.prepare(
        `DELETE FROM scheduled_reminders WHERE user_uid = ? AND fire_date = ? AND fired = 0`
      ).bind(uid, d).run();
    }

    if (reminders.length) {
      const stmt = env.DB.prepare(
        `INSERT INTO scheduled_reminders
           (user_uid, task_id, task_name, reminder_type, fire_date, fire_time, fired, created_at)
         SELECT ?, ?, ?, ?, ?, ?, 0, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM scheduled_reminders
           WHERE user_uid = ? AND task_id = ? AND reminder_type = ? AND fire_date = ?
         )`
      );
      const batch = reminders.map(r =>
        stmt.bind(uid, r.taskId, r.taskName, r.type, r.date, r.time, now,
                   uid, r.taskId, r.type, r.date)
      );
      await env.DB.batch(batch);
    }

    return json({ ok: true, saved: reminders.length });
  } catch (e) {
    console.error('save-subscription failed', e);
    return json({ error: 'Database write failed: ' + e.message }, 500);
  }
}

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
async function dispatchDueReminders(env) {
  const { date, time } = kuwaitNowParts();
  const [nowH, nowM] = time.split(':').map(Number);
  let lookbackH = nowH, lookbackM = nowM - 30;
  if (lookbackM < 0) { lookbackM += 60; lookbackH -= 1; }
  if (lookbackH < 0) { lookbackH = 0; lookbackM = 0; } // clamp — don't reach into yesterday
  const lookbackTime = `${String(lookbackH).padStart(2,'0')}:${String(lookbackM).padStart(2,'0')}`;

  let due;
  try {
    due = await env.DB.prepare(
      `SELECT * FROM scheduled_reminders
       WHERE fire_date = ? AND fire_time <= ? AND fire_time >= ? AND fired = 0`
    ).bind(date, time, lookbackTime).all();
  } catch (e) {
    console.error('cron: due-reminder query failed', e);
    return;
  }

  const rows = due.results || [];
  if (!rows.length) return;

  // Group by user so we fetch each user's subscription once, not once per reminder.
  const byUser = {};
  for (const r of rows) {
    if (!byUser[r.user_uid]) byUser[r.user_uid] = [];
    byUser[r.user_uid].push(r);
  }

  const vapid = {
    subject: env.VAPID_SUBJECT || 'mailto:example@example.com',
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };

  const REMINDER_LABEL = {
    lead: { title: '⏳ بعد 30 دقيقة', bodyFn: n => `${n} هتبدأ بعد نص ساعة` },
    start: { title: '⏰ حان الوقت', bodyFn: n => `${n} — دلوقتي` },
    ending: { title: '⌛ باقي ٣٠ دقيقة', bodyFn: n => `${n} — هتخلص وقتها قريب` }
  };

  for (const uid of Object.keys(byUser)) {
    let subRow;
    try {
      subRow = await env.DB.prepare(
        `SELECT * FROM push_subscriptions WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(uid).first();
    } catch (e) {
      console.error('cron: subscription lookup failed for', uid, e);
      continue;
    }
    if (!subRow) continue; // user has reminders but no active subscription (never subscribed / revoked)

    const subscription = {
      endpoint: subRow.endpoint,
      keys: { p256dh: subRow.p256dh, auth: subRow.auth }
    };

    for (const reminder of byUser[uid]) {
      const label = REMINDER_LABEL[reminder.reminder_type] || REMINDER_LABEL.start;
      const payload = {
        title: label.title,
        body: label.bodyFn(reminder.task_name),
        tag: `${reminder.task_id}-${reminder.reminder_type}`
      };

      try {
        const { headers, method, body } = await buildPushPayload(
          {
            data: payload,
            options: {
              ttl: 3600,
              // Explicit high urgency, per the original request — this is the correct
              // place for that header, unlike the earlier client-only setTimeout
              // architecture where there was no push request to attach it to at all.
              urgency: 'high',
              topic: reminder.task_id
            }
          },
          subscription,
          {
            subject: vapid.subject,
            publicKey: vapid.publicKey,
            privateKey: vapid.privateKey
          }
        );

        const pushRes = await fetch(subscription.endpoint, { method, headers, body });

        if (pushRes.status === 404 || pushRes.status === 410) {
          // Subscription is dead (user revoked permission, uninstalled PWA, etc.) —
          // remove it so the cron doesn't keep retrying it every minute forever.
          await env.DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`)
            .bind(subRow.endpoint).run();
        }
      } catch (e) {
        console.error('cron: push send failed for', reminder.task_id, e);
        // Do NOT mark as fired on failure — leave it for potential retry next minute
        // only if still within a reasonable window; simplest correct behavior here is
        // to still mark fired to avoid a permanently-stuck row spamming retries for an
        // endpoint that's failing for a non-transient reason. Marked fired below
        // unconditionally, same as the success path, for that reason.
      }

      try {
        await env.DB.prepare(`UPDATE scheduled_reminders SET fired = 1 WHERE id = ?`)
          .bind(reminder.id).run();
      } catch (e) {
        console.error('cron: failed to mark reminder fired', reminder.id, e);
      }
    }
  }
}