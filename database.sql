-- ============================================================
-- USAGI LIFE DASHBOARD - SUPABASE 免费云端数据库一键建表脚本
-- 专属项目: https://rlbovlevaddvbuchsxwz.supabase.co
-- 复制以下全部代码，粘贴到 Supabase 的 SQL Editor 中点击 Run 即可！
-- ============================================================

-- 1. 创建用户手账核心数据表
CREATE TABLE IF NOT EXISTS public.usagi_userdata (
    username TEXT PRIMARY KEY,
    nickname TEXT,
    password TEXT,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 启用行级安全 (RLS) 与开放客户端读写权限
ALTER TABLE public.usagi_userdata ENABLE ROW LEVEL SECURITY;

-- 允许客户端通过 API Key 读写该表（适合个人及多用户独立手账同步，支持反复执行）
DROP POLICY IF EXISTS "Allow public read and upsert" ON public.usagi_userdata;
CREATE POLICY "Allow public read and upsert" ON public.usagi_userdata
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. 创建自动更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_usagi_userdata_updated_at ON public.usagi_userdata;
CREATE TRIGGER update_usagi_userdata_updated_at
    BEFORE UPDATE ON public.usagi_userdata
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
