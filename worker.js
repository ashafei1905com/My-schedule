// Cloudflare Worker — AI proxy + Web Push sender for جدول عبدالله
//
// This Worker exists so the GROQ API key and VAPID private key are never exposed
// in the browser.

const ALLOWED_ORIGIN = 'https://ashafei1905com.github.io';

// --- Groq chat proxy config ---
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 600;

// --- Web Push config ---
const VAPID_PUBLIC_KEY = 'BJY-WY3oi2ypIAvR-ZIUmgXJBZxNkatg4uUVXMsb1ft-uv4xslN94W1K2PX25SslYti-AgUPFm8bdTc-2AFPkUY';
const CONTACT = 'mailto:abdullah@example.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function safeGetBody(request) {
  // Utility so we can reuse consistent JSON parse errors
  return request.json().catch(() => null);
}

async function saveSubscription(DB, subscription) {
  const subText = JSON.stringify(subscription);
  const now = Date.now();

  // Upsert by exact subscription JSON string (simple + safe dedupe)
  const existing = await DB.prepare('SELECT id FROM push_subscriptions WHERE subscription = ?')
    .bind(subText)
    .first();

  if (existing && existing.id) {
    await DB.prepare('UPDATE push_subscriptions SET lastSeenAt = ? WHERE id = ?')
      .bind(now, existing.id)
      .run();
    return existing.id;
  }

  const res = await DB.prepare(
    'INSERT INTO push_subscriptions(subscription, createdAt, lastSeenAt) VALUES(?, ?, ?)'
  ).bind(subText, now, now).run();

  return res?.lastRowId;
}

async function getSubscriptions(DB) {
  const rows = await DB.prepare('SELECT subscription FROM push_subscriptions').all();
  const out = [];
  for (const r of rows || []) {
    try {
      const s = JSON.parse(r.subscription);
      if (s) out.push(s);
    } catch {
      // ignore bad rows
    }
  }
  return out;
}

async function shouldSend(DB, notifKey) {
  const r = await DB.prepare('SELECT notifKey FROM push_notification_log WHERE notifKey = ?')
    .bind(notifKey)
    .first();
  return !r;
}

async function markSent(DB, notifKey, taskId) {
  await DB.prepare(
    'INSERT INTO push_notification_log(notifKey, taskId, sentAt) VALUES(?, ?, ?)'
  ).bind(notifKey, taskId || null, Date.now()).run();
}

async function sendPushAll(DB, payload, notifKey, taskId, env) {
  const okToSend = await shouldSend(DB, notifKey);
  if (!okToSend) return { skipped: true };

  const subs = await getSubscriptions(DB);
  if (!subs.length) return { skipped: true, reason: 'no_subscriptions' };

  // Workers-compatible Web Push implementation.
  const { default: webpush } = await import('web-push-neo');



  // Cloudflare worker environment: web-push works, but relies on VAPID private key.

  webpush.setVapidDetails(CONTACT, VAPID_PUBLIC_KEY, () => env.VAPID_PRIVATE_KEY);

  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Send sequentially to avoid exhausting CPU time in cron.
  // (Could be parallelized later if needed.)
  let sentCount = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, data);
      sentCount++;
    } catch {
      // If subscription is invalid/expired, we keep it for now.
      // Could be deleted on 410/404 later.
    }
  }

  await markSent(DB, notifKey, taskId);
  return { skipped: false, sentCount };
}

function getReminderScheduleTasks() {
  // NOTE: This worker does not know your full schedule JS data model.
  // So we require the client to provide a list of "due reminders" when it
  // registers. For this course project, we implement a generic sender.
  //
  // The scheduled() handler will expect a POST-created payload in D1.
  // Instead of inventing schedule mapping here, we send payloads when the
  // client tells us what to send.
  //
  // For now, scheduled() reads from `push_notification_log` only and cannot
  // infer tasks.
  return [];
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const origin = request.headers.get('Origin') || '';
    if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
      return json({ error: 'Origin not allowed' }, 403);
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/save-subscription') {
      const body = await safeGetBody(request);
      if (!body || !body.subscription) {
        return json({ error: 'subscription required' }, 400);
      }
      if (!env.DB) {
        return json({ error: 'D1 binding missing (DB)' }, 500);
      }

      const id = await saveSubscription(env.DB, body.subscription);
      return json({ ok: true, id });
    }

    // Default: Groq proxy endpoint (your current site already calls POST body
    // with {messages, system}).
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
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

  // scheduled cron: send reminder pushes.
  async scheduled(controller, env, ctx) {
    // For now, we do not try to reconstruct your schedule.
    // If you want scheduled() to send real tasks, we must either:
    //  - (A) store "next due reminder payloads" in D1 from the client, or
    //  - (B) port the schedule/time logic into this worker.
    //
    // This implementation intentionally does nothing, but keeps the endpoint
    // deployable so /api/save-subscription works.
    return;
  }
};

