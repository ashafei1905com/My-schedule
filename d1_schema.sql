-- Push subscriptions for Web Push reminders

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  lastSeenAt INTEGER
);

-- Notifications sent marker (dedupe)
CREATE TABLE IF NOT EXISTS push_notification_log (
  notifKey TEXT PRIMARY KEY,
  taskId TEXT,
  sentAt INTEGER NOT NULL
);

