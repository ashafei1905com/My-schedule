import { json } from '../../../core/utils/response.js';
import { buildPushPayload } from '@block65/webcrypto-web-push';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': (env && env.ALLOWED_ORIGIN) || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

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

export async function handleSaveSubscription(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const allowedOrigin = env?.ALLOWED_ORIGIN || '';
  const origin = request.headers.get('Origin') || '';
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return json({ error: 'Origin not allowed' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { uid, subscription, reminders, weeklySchedule } = body;
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

    // Replace PENDING reminders for the incoming dates for this user.
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

    // If a recurring template was provided, also save it so the server can generate reminders if dates ever lapse
    if (weeklySchedule && env.DB.saveRecurringSchedule) {
      await env.DB.saveRecurringSchedule(uid, weeklySchedule);
    }

    return json({ ok: true, saved: reminders.length });
  } catch (e) {
    console.error('save-subscription failed', e);
    return json({ error: 'Database write failed: ' + e.message }, 500);
  }
}

export async function handleTestPush(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(env) });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { uid, subscription, title, message } = body;
  let sub = subscription;
  if ((!sub || !sub.endpoint || !sub.keys) && uid && env.DB) {
    try {
      const subRow = await env.DB.prepare(
        `SELECT * FROM push_subscriptions WHERE user_uid = ? ORDER BY created_at DESC LIMIT 1`
      ).bind(uid).first();
      if (subRow) {
        sub = { endpoint: subRow.endpoint, keys: { p256dh: subRow.p256dh, auth: subRow.auth } };
      }
    } catch (e) {
      console.warn('test push sub lookup failed:', e);
    }
  }

  if (!sub || !sub.endpoint || !sub.keys) {
    return json({ error: 'Valid subscription required' }, 400);
  }

  const vapid = {
    subject: env?.VAPID_SUBJECT || 'mailto:ashafei1905@gmail.com',
    publicKey: env?.VAPID_PUBLIC_KEY,
    privateKey: env?.VAPID_PRIVATE_KEY,
  };

  const payload = {
    title: title || '🔔 تجربة الإشعارات بنجاح',
    body: message || 'الإشعارات شغالة تمام وهتوصلك في مواعيد مهامك حتى لو التطبيق مقفول!',
    tag: 'test-notification-' + Date.now()
  };

  try {
    const { headers, method, body: pushBody } = await buildPushPayload(
      {
        data: payload,
        options: {
          ttl: 3600,
          urgency: 'high',
          topic: 'test'
        }
      },
      subscription,
      {
        subject: vapid.subject,
        publicKey: vapid.publicKey,
        privateKey: vapid.privateKey
      }
    );

    const pushRes = await fetch(subscription.endpoint, { method, headers, body: pushBody });
    if (!pushRes.ok) {
      const txt = await pushRes.text().catch(() => '');
      return json({ error: `Push service returned ${pushRes.status}: ${txt}`, status: pushRes.status }, 400);
    }
    return json({ ok: true, message: 'Push notification sent successfully!' });
  } catch (e) {
    console.error('test-push failed', e);
    return json({ error: 'Failed to send test push: ' + e.message }, 500);
  }
}

export async function dispatchDueReminders(env) {
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
    subject: env?.VAPID_SUBJECT || 'mailto:ashafei1905@gmail.com',
    publicKey: env?.VAPID_PUBLIC_KEY,
    privateKey: env?.VAPID_PRIVATE_KEY,
  };

  const REMINDER_LABEL = {
    lead: { title: '⏳ اقترب الموعد', bodyFn: n => `${n} — هتبدأ قريب` },
    start: { title: '⏰ حان الوقت', bodyFn: n => `${n} — دلوقتي` },
    ending: { title: '⌛ اقتربت النهاية', bodyFn: n => `${n} — هتخلص وقتها قريب` }
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
        } else if (pushRes.ok) {
          console.log(`[Push] Successfully dispatched reminder '${reminder.task_name}' (${reminder.reminder_type}) to user ${uid}`);
        }
      } catch (e) {
        console.error('cron: push send failed for', reminder.task_id, e);
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
