-- ============================================================
-- 002_regions.sql
-- Regional seasonality layer — run in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING
-- ============================================================

-- 1. Regions lookup table
CREATE TABLE IF NOT EXISTS public.regions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Seed Utah as the first region
INSERT INTO public.regions (name, slug)
VALUES ('Utah', 'utah')
ON CONFLICT (slug) DO NOTHING;

-- 2. Per-region seasonality overrides
--    One row per (region, flower). Upserted on each CSV import.
CREATE TABLE IF NOT EXISTS public.region_flower_seasonality (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id        uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  flower_id        uuid NOT NULL REFERENCES public.flowers(id) ON DELETE CASCADE,
  in_season_months int2[] NOT NULL DEFAULT '{}',
  shoulder_months  int2[] NOT NULL DEFAULT '{}',
  updated_at       timestamptz DEFAULT now(),
  UNIQUE (region_id, flower_id)
);

-- 3. Import audit log
CREATE TABLE IF NOT EXISTS public.region_imports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id   uuid NOT NULL REFERENCES public.regions(id),
  filename    text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  row_count   int NOT NULL DEFAULT 0,
  errors_json jsonb DEFAULT '[]'::jsonb
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_flower_seasonality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_imports ENABLE ROW LEVEL SECURITY;

-- Regions: all authenticated users read
DROP POLICY IF EXISTS "auth_read_regions" ON public.regions;
CREATE POLICY "auth_read_regions"
  ON public.regions FOR SELECT TO authenticated USING (true);

-- Region seasonality: all authenticated users read
DROP POLICY IF EXISTS "auth_read_region_seasonality" ON public.region_flower_seasonality;
CREATE POLICY "auth_read_region_seasonality"
  ON public.region_flower_seasonality FOR SELECT TO authenticated USING (true);

-- Region seasonality: any authenticated user can write (admin = any authed user for now)
DROP POLICY IF EXISTS "auth_write_region_seasonality" ON public.region_flower_seasonality;
CREATE POLICY "auth_write_region_seasonality"
  ON public.region_flower_seasonality FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Import log: all authenticated users read
DROP POLICY IF EXISTS "auth_read_region_imports" ON public.region_imports;
CREATE POLICY "auth_read_region_imports"
  ON public.region_imports FOR SELECT TO authenticated USING (true);

-- Import log: users can insert their own rows
DROP POLICY IF EXISTS "auth_insert_region_imports" ON public.region_imports;
CREATE POLICY "auth_insert_region_imports"
  ON public.region_imports FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());
