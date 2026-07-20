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

import { buildPushHTTPRequest } from '@block65/webcrypto-web-push';

const ALLOWED_ORIGIN = 'https://ashafei1905com.github.io';
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 600;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/save-subscription') {
      return handleSaveSubscription(request, env);
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
          messages: groqMessages
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

    // Wholesale-replace today's reminders for this user. Scoped to the date(s) present
    // in the incoming payload, not the whole user, so re-saving today's reminders never
    // clobbers a different day's already-scheduled ones (relevant once/if this is
    // extended to schedule more than just today in advance).
    const dates = [...new Set(reminders.map(r => r.date))];
    for (const d of dates) {
      await env.DB.prepare(
        `DELETE FROM scheduled_reminders WHERE user_uid = ? AND fire_date = ?`
      ).bind(uid, d).run();
    }

    if (reminders.length) {
      // D1 batch insert — one round trip instead of N.
      const stmt = env.DB.prepare(
        `INSERT INTO scheduled_reminders
         (user_uid, task_id, task_name, reminder_type, fire_date, fire_time, fired, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
      );
      const batch = reminders.map(r =>
        stmt.bind(uid, r.taskId, r.taskName, r.type, r.date, r.time, now)
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
        const { endpoint, headers, body: pushBody } = await buildPushHTTPRequest({
          privateJWK: vapid.privateKey,
          publicJWK: vapid.publicKey,
          subscription,
          message: {
            payload: JSON.stringify(payload),
            adminContact: vapid.subject,
            options: {
              ttl: 3600,
              // Explicit high urgency, per the original request — this is the correct
              // place for that header, unlike the earlier client-only setTimeout
              // architecture where there was no push request to attach it to at all.
              urgency: 'high',
              topic: reminder.task_id
            }
          }
        });

        const pushRes = await fetch(endpoint, { method: 'POST', headers, body: pushBody });

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
