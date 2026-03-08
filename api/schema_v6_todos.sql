-- 创建 todos 表以支持云端同步
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    list_name TEXT DEFAULT '待办事项' NOT NULL,
    priority TEXT DEFAULT 'P3' NOT NULL,
    notes TEXT,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE
);

-- 启用权限（针对 Supabase RLS，若未开启可跳过，但建议开启）
-- ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can only see their own todos" ON public.todos FOR ALL USING (auth.uid()::text = user_id::text);

-- 如果 user_id 字段定义有问题，请确保它与 users 表的 ID 类型一致。
-- 之前的 users 表定义 ID 为 BIGINT，所以这里也采用 BIGINT。
