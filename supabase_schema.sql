-- DANGER: Drops existing tables to rebuild them with the correct schema
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.storages CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create PROFILES Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    workspace_title TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Repeatable Policies
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert/update profiles" ON public.profiles;
CREATE POLICY "Allow insert/update profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. Create SPACES Table
CREATE TABLE public.spaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_count INTEGER DEFAULT 2,
    image_url TEXT,
    dimensions TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read spaces" ON public.spaces;
CREATE POLICY "Allow public read spaces" ON public.spaces FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all actions spaces" ON public.spaces;
CREATE POLICY "Allow all actions spaces" ON public.spaces FOR ALL USING (true) WITH CHECK (true);

-- 3. Create STORAGES Table
CREATE TABLE public.storages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
    space_name TEXT,
    total_items INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 20,
    status TEXT DEFAULT 'empty',
    image_url TEXT,
    compartments INTEGER DEFAULT 4,
    type TEXT DEFAULT 'Closet',
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.storages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read storages" ON public.storages;
CREATE POLICY "Allow public read storages" ON public.storages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all actions storages" ON public.storages;
CREATE POLICY "Allow all actions storages" ON public.storages FOR ALL USING (true) WITH CHECK (true);

-- 4. Create ITEMS Table
CREATE TABLE public.items (
    id TEXT PRIMARY KEY,
    container_id TEXT REFERENCES public.storages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    quantity INTEGER DEFAULT 1,
    condition TEXT DEFAULT 'Good',
    is_spare BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read items" ON public.items;
CREATE POLICY "Allow public read items" ON public.items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all actions items" ON public.items;
CREATE POLICY "Allow all actions items" ON public.items FOR ALL USING (true) WITH CHECK (true);

-- 5. Create NOTES Table
CREATE TABLE public.notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    date TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read notes" ON public.notes;
CREATE POLICY "Allow public read notes" ON public.notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all actions notes" ON public.notes;
CREATE POLICY "Allow all actions notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);

-- 6. Storage Bucket Setup
-- Create the storage bucket for images if not already existing
INSERT INTO storage.buckets (id, name, public)
VALUES ('moonferret-images', 'moonferret-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public storage uploads and reads
DROP POLICY IF EXISTS "Public Read Objects" ON storage.objects;
CREATE POLICY "Public Read Objects" ON storage.objects FOR SELECT USING (bucket_id = 'moonferret-images');

DROP POLICY IF EXISTS "Public Insert Objects" ON storage.objects;
CREATE POLICY "Public Insert Objects" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'moonferret-images');

DROP POLICY IF EXISTS "Public Update Objects" ON storage.objects;
CREATE POLICY "Public Update Objects" ON storage.objects FOR UPDATE USING (bucket_id = 'moonferret-images');

DROP POLICY IF EXISTS "Public Delete Objects" ON storage.objects;
CREATE POLICY "Public Delete Objects" ON storage.objects FOR DELETE USING (bucket_id = 'moonferret-images');
