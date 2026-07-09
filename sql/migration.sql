-- ─────────────────────────────────────────────────────
-- MoonFerret — Supabase Schema Migration
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────

-- 1. Add parent_id to storages for recursive sub-storage hierarchy
ALTER TABLE storages
  ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES storages(id) ON DELETE CASCADE;

-- 2. Add poly-classification columns to items
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'item-accessory',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS sub_category TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS brand TEXT;

-- 3. Create outfits table if not exists
CREATE TABLE IF NOT EXISTS outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create outfit_items junction table
CREATE TABLE IF NOT EXISTS outfit_items (
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  item_id TEXT,
  PRIMARY KEY (outfit_id, item_id)
);

-- 5. Enable RLS on new tables
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for outfits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'outfits' AND policyname = 'Users can read own outfits'
  ) THEN
    CREATE POLICY "Users can read own outfits" ON outfits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'outfits' AND policyname = 'Users can insert own outfits'
  ) THEN
    CREATE POLICY "Users can insert own outfits" ON outfits
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'outfits' AND policyname = 'Users can delete own outfits'
  ) THEN
    CREATE POLICY "Users can delete own outfits" ON outfits
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 7. RLS policies for outfit_items (inherit from outfits ownership)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'outfit_items' AND policyname = 'Users can manage own outfit items'
  ) THEN
    CREATE POLICY "Users can manage own outfit items" ON outfit_items
      FOR ALL USING (
        EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
      );
  END IF;
END
$$;
