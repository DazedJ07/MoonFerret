-- ─────────────────────────────────────────────────────
-- MoonFerret — Complete Database Setup SQL Script
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ─────────────────────────────────────────────────────

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  workspace_title TEXT DEFAULT 'MoonFerret Home',
  avatar_url TEXT,
  profile_pic TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace_title TEXT DEFAULT 'MoonFerret Home';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_pic TEXT;

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR ALL USING (auth.uid() = id);
  END IF;
END
$$;

-- 2. Spaces Table
CREATE TABLE IF NOT EXISTS public.spaces (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  image_count INTEGER DEFAULT 0,
  image_url TEXT,
  dimensions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Spaces
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;

-- Spaces RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spaces' AND policyname = 'Users can view their own spaces') THEN
    CREATE POLICY "Users can view their own spaces" ON public.spaces
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spaces' AND policyname = 'Users can manage their own spaces') THEN
    CREATE POLICY "Users can manage their own spaces" ON public.spaces
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 3. Storages Table (with recursive parent_id support)
CREATE TABLE IF NOT EXISTS public.storages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id TEXT REFERENCES public.spaces(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES public.storages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  space_name TEXT,
  total_items INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 20,
  status TEXT DEFAULT 'empty',
  image_url TEXT,
  compartments INTEGER DEFAULT 0,
  type TEXT DEFAULT 'Closet',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Storages
ALTER TABLE public.storages ENABLE ROW LEVEL SECURITY;

-- Storages RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storages' AND policyname = 'Users can view their own storages') THEN
    CREATE POLICY "Users can view their own storages" ON public.storages
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storages' AND policyname = 'Users can manage their own storages') THEN
    CREATE POLICY "Users can manage their own storages" ON public.storages
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 4. Items Table (with poly-classification columns)
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id TEXT REFERENCES public.storages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  quantity INTEGER DEFAULT 1,
  condition TEXT DEFAULT 'Good',
  is_spare BOOLEAN DEFAULT false,
  item_type TEXT DEFAULT 'item-accessory',
  category TEXT,
  sub_category TEXT,
  size TEXT,
  color TEXT,
  material TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Items RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Users can view their own items') THEN
    CREATE POLICY "Users can view their own items" ON public.items
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Users can manage their own items') THEN
    CREATE POLICY "Users can manage their own items" ON public.items
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 5. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can view their own notes') THEN
    CREATE POLICY "Users can view their own notes" ON public.notes
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Users can manage their own notes') THEN
    CREATE POLICY "Users can manage their own notes" ON public.notes
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 6. Outfits Table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on Outfits
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- Outfits RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfits' AND policyname = 'Users can view their own outfits') THEN
    CREATE POLICY "Users can view their own outfits" ON public.outfits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfits' AND policyname = 'Users can manage their own outfits') THEN
    CREATE POLICY "Users can manage their own outfits" ON public.outfits
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 7. Outfit Items Junction Table
CREATE TABLE IF NOT EXISTS public.outfit_items (
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  PRIMARY KEY (outfit_id, item_id)
);

-- Enable RLS on Outfit Items
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

-- Outfit Items RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'Users can manage their own outfit items') THEN
    CREATE POLICY "Users can manage their own outfit items" ON public.outfit_items
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.outfits 
          WHERE public.outfits.id = public.outfit_items.outfit_id 
          AND public.outfits.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- 8. Trigger Function: Automatically create public profile on new sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  display_name_val TEXT;
BEGIN
  -- Extract email prefix as fallback
  username_val := COALESCE(split_part(new.email, '@', 1), 'user_' || substr(md5(random()::text), 1, 8));
  display_name_val := username_val;

  -- Extract metadata if present
  IF new.raw_user_meta_data IS NOT NULL THEN
    IF new.raw_user_meta_data ? 'username' THEN
      username_val := COALESCE(new.raw_user_meta_data->>'username', username_val);
    END IF;
    IF new.raw_user_meta_data ? 'full_name' THEN
      display_name_val := COALESCE(new.raw_user_meta_data->>'full_name', display_name_val);
    END IF;
  END IF;

  INSERT INTO public.profiles (id, username, display_name, workspace_title)
  VALUES (
    new.id,
    username_val,
    display_name_val,
    'MoonFerret Home'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent trigger failure from blocking authentication signup
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Bind handle_new_user to auth.users created event
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
