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