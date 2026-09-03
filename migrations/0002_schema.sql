-- Per-user app document for الجدول الذكي (Smart Schedule).
-- One row per signed-in account; guests persist locally only.
create table if not exists user_app_state (
  user_id    text primary key,
  schedule   jsonb not null default '{}'::jsonb,
  settings   jsonb not null default '{}'::jsonb,
  stats      jsonb not null default '{}'::jsonb,
  history    jsonb not null default '{}'::jsonb,
  food_logs  jsonb not null default '{}'::jsonb,
  reports    jsonb not null default '[]'::jsonb,
  meal_options jsonb not null default '{}'::jsonb,
  ai_chat    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
