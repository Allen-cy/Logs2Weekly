-- AI Productivity Hub - Database Schema Evolution v3 (Aggregation Support)

-- Add processing status and parent reference to logs table
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.logs(id) ON DELETE SET NULL;

-- Add a comment to describe the fields
COMMENT ON COLUMN public.logs.is_processed IS '标记原始记录是否已被聚合整理到日报中';
COMMENT ON COLUMN public.logs.parent_id IS '如果该记录是被聚合后的结果，此字段为空；如果是原始碎片记录，则指向聚合后的日报 ID';
