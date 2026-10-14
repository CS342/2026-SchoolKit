-- ================================================================
-- Design Editor Schema
-- Run this in Supabase SQL Editor after schema.sql and stories-schema.sql
-- ================================================================

-- ─── designs table ────────────────────────────────────────────────
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Design',

  -- The JSONB scene graph (document model)
  doc JSONB NOT NULL DEFAULT '{
    "version": 1,
    "canvas": { "width": 1280, "height": 720, "background": "#FFFFFF" },
    "objects": [],
    "assets": {}
  }'::jsonb,

  -- Thumbnail as a Storage URL (generated client-side on save)
  thumbnail_url TEXT,

  -- Sharing
  is_shared BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,

  -- Publishing to resources
  published_resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── design_assets (track uploaded images per design) ─────────────
CREATE TABLE design_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Enable RLS ──────────────────────────────────────────────────
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;

-- ─── designs RLS policies ─────────────────────────────────────────
CREATE POLICY "Owner can view own designs"
  ON designs FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Published designs are viewable by all"
  ON designs FOR SELECT
  TO authenticated
  USING (published_resource_id IS NOT NULL);

CREATE POLICY "Owner can insert designs"
  ON designs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update own designs"
  ON designs FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own designs"
  ON designs FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ─── design_assets RLS policies ───────────────────────────────────
CREATE POLICY "Asset owner can manage"
  ON design_assets FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Design owner can view assets"
  ON design_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = design_assets.design_id
        AND designs.owner_id = auth.uid()
    )
  );

-- ─── resources table: add INSERT/UPDATE/DELETE policies for publishing ──
-- (The existing schema.sql only has a SELECT policy on resources)
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (true);

-- ─── updated_at trigger (reuse existing function) ─────────────────
CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────────
CREATE INDEX idx_designs_owner ON designs(owner_id, updated_at DESC);
CREATE INDEX idx_designs_share_token ON designs(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_design_assets_design ON design_assets(design_id);

-- ─── Storage bucket for design assets ─────────────────────────────
-- Create manually in Dashboard -> Storage -> New bucket -> "design-assets" (public)
-- Or: INSERT INTO storage.buckets (id, name, public) VALUES ('design-assets', 'design-assets', true);

-- Storage policies for design-assets bucket
CREATE POLICY "Staff can upload design assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'design-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Staff can update own design assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'design-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access for design assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'design-assets');

CREATE POLICY "Staff can delete own design assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'design-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
