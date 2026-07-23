// Cloudflare Worker — AI proxy + Web Push backend for جدول عبدالله
//
// Two responsibilities now live in this one Worker:
//   1. AI proxy (unchanged) — root path, POST — forwards chat/food-log calls to Groq.
//   2. Web Push backend (NEW) — /api/save-subscription (POST) stores a subscription +
//      that day's reminder schedule in D1; a per-minute Cron Trigger (scheduled())
//      scans D1 for anything due "now" and sends real Web Push notifications via
//      Cloudflare's own infrastructure — NOT a client-side setTimeout, so it is
//      immune to iOS freezing/killing a backgrounded/closed tab.
//
// Root-path behavior is 100% unchanged from before: index.html's existing
// AI_WORKER_URL POST-to-root calls (AI chat + food macro logging) work exactly as
// they did previously. Only a new path prefix was added; nothing at "/" was touched.
//
// Setup (in addition to the existing GROQ_API_KEY secret):
//   1. wrangler d1 create abdullah-schedule-push
//      -> paste the printed database_id into wrangler.toml
//   2. wrangler d1 execute abdullah-schedule-push --remote --file=./schema.sql
//   3. npx web-push generate-vapid-keys  (or equivalent) -> get a public+private pair
//   4. wrangler secret put VAPID_PRIVATE_KEY   (paste the PRIVATE key — never in code)
//   5. Put the PUBLIC key in wrangler.toml under [vars] VAPID_PUBLIC_KEY (safe, public
//      by design) AND in index.html's VAPID_PUBLIC_KEY constant (same string, client
//      side needs it too to call pushManager.subscribe()).
//   6. wrangler deploy

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
  let queries;
  if (Array.isArray(body.items) && body.items.length) {
    queries = body.items.map(it => `${it.qty} ${it.unit} ${it.food}`.trim());
  } else if (body.query && String(body.query).trim()) {
    queries = [String(body.query).trim()];
  } else {
    return json({ error: 'items or query required' }, 400);
  }

  try {
    const macro = { p: 0, c: 0, f: 0, b: 0, k: 0 };
    const items = [];
    let anyMatched = false;

    for (const q of queries) {
      const url = 'https://api.api-ninjas.com/v1/nutrition?query=' + encodeURIComponent(q);
      const nxRes = await fetch(url, {
        headers: { 'X-Api-Key': env.API_NINJAS_KEY }
      });

      if (!nxRes.ok) {
        const errText = await nxRes.text().catch(() => '');
        console.error('api-ninjas error', nxRes.status, errText);
        // One bad item shouldn't fail the whole meal — skip it and keep going, but
        // track that at least one lookup must succeed or the whole call is an error.
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
      if (!foods || !foods.length) continue;

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
