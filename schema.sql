-- D1 schema for Web Push notifications — جدول عبدالله
-- Run with: wrangler d1 execute abdullah-schedule-push --remote --file=./schema.sql

-- One row per signed-in user's push subscription. A user can only have one active
-- subscription per device; re-subscribing (e.g. after clearing site data) replaces it.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uid TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_uid);

-- One row per reminder that should fire at a specific HH:MM (Asia/Kuwait, 24h format,
-- matching getKuwaitNow()'s minutes-since-midnight logic already used client-side).
-- Regenerated wholesale each time the client's today's task list changes (see
-- /api/save-subscription below) rather than diffed, since the full day's task list is
-- cheap to resend and this avoids stale-row bugs from partial updates.
--
-- reminder_type distinguishes the THREE existing reminder kinds from
-- scheduleTodayNotifications() so parity is exact:
--   'lead'    -> "starting soon" (30 min before start)
--   'start'   -> "starting now"
--   'ending'  -> "30 min left" (before effective end)
CREATE TABLE IF NOT EXISTS scheduled_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_uid TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK(reminder_type IN ('lead','start','ending')),
  fire_date TEXT NOT NULL,     -- 'YYYY-MM-DD', Kuwait-local calendar date
  fire_time TEXT NOT NULL,     -- 'HH:MM' 24h, Kuwait-local
  fired INTEGER NOT NULL DEFAULT 0,  -- 0/1 — set to 1 once dispatched, never re-sent
  created_at INTEGER NOT NULL
);
-- The cron scans by (fire_date, fire_time, fired) every minute — this composite index
-- is what keeps that scan fast instead of a full table scan as reminders accumulate.
CREATE INDEX IF NOT EXISTS idx_reminders_due ON scheduled_reminders(fire_date, fire_time, fired);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON scheduled_reminders(user_uid);
