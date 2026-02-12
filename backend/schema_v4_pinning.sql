-- AI Productivity Hub - Database Schema Evolution v4 (Pinning Support)

-- Add is_pinned column to logs table
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN public.logs.is_pinned IS '标记记录是否置顶显示';
