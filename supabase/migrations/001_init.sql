-- =============================================================
-- Florist Seasonality Planner — initial schema + RLS
-- Run this in Supabase SQL Editor (or via supabase db push)
-- Safe to re-run: drops existing tables first.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- TEARDOWN (reverse dependency order so FKs don't block drops)
-- ─────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.event_items CASCADE;
DROP TABLE IF EXISTS public.events      CASCADE;
DROP TABLE IF EXISTS public.flowers     CASCADE;


-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE public.flowers (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name       text        NOT NULL,
  category          text        NOT NULL,   -- 'focal' | 'filler' | 'greenery' | 'accent'
  color_tags        text[],                 -- e.g. {white, blush, yellow}
  in_season_months  int2[]      NOT NULL,   -- 1–12; must have at least one value
  shoulder_months   int2[],                 -- 1–12; months with limited availability
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT flowers_category_check
    CHECK (category IN ('focal', 'filler', 'greenery', 'accent')),
  CONSTRAINT flowers_in_season_nonempty
    CHECK (array_length(in_season_months, 1) > 0)
);

CREATE TABLE public.events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name        text        NOT NULL,
  event_date  date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.event_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  flower_id   uuid        NOT NULL REFERENCES public.flowers (id) ON DELETE RESTRICT,
  quantity    integer     NOT NULL DEFAULT 1,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT event_items_quantity_positive CHECK (quantity > 0),
  -- one row per flower per event; adjust qty rather than adding duplicates
  UNIQUE (event_id, flower_id)
);


-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX events_user_id_idx        ON public.events      (user_id);
CREATE INDEX event_items_event_id_idx  ON public.event_items (event_id);
CREATE INDEX flowers_category_idx      ON public.flowers     (category);


-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.flowers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_items  ENABLE ROW LEVEL SECURITY;


-- flowers: any authenticated user may read; no client writes
CREATE POLICY "flowers: authenticated read"
  ON public.flowers
  FOR SELECT
  TO authenticated
  USING (true);


-- events: owner-only CRUD
CREATE POLICY "events: owner select"
  ON public.events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "events: owner insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "events: owner update"
  ON public.events FOR UPDATE
  TO authenticated
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "events: owner delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- event_items: CRUD only when the parent event belongs to auth.uid()
-- (ownership check goes through the events table so no user_id column needed here)

CREATE POLICY "event_items: owner select"
  ON public.event_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_items.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "event_items: owner insert"
  ON public.event_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_items.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "event_items: owner update"
  ON public.event_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_items.event_id
        AND events.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_items.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "event_items: owner delete"
  ON public.event_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_items.event_id
        AND events.user_id = auth.uid()
    )
  );
