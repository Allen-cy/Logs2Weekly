-- ai-productivity-hub - Database Schema Evolution v8
-- Support desktop native settings in cloud config

ALTER TABLE public.user_configs ADD COLUMN IF NOT EXISTS archive_retention_days INTEGER DEFAULT 15;
ALTER TABLE public.user_configs ADD COLUMN IF NOT EXISTS global_hotkey TEXT DEFAULT 'Alt+Space';
