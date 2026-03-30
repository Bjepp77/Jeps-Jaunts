-- ── Event-level planning fields ───────────────────────────────────────────────
--
-- These four fields live on the events table so they are the canonical source
-- of truth for estimator pre-population. When a florist navigates from the
-- Event Cart page to the Estimator page, these values initialize the sliders
-- and selects — regardless of whether a saved estimate exists.
--
-- guests_per_table is stored here for future configurability; it defaults to 8
-- and the UI does not yet expose a control for it.
--
-- NOTE: reception_tier uses 'micro' (not 'none') as the minimum default because
-- the existing pricing engine only supports micro|standard|lush.

alter table public.events
  add column if not exists wedding_party_pairs  integer  not null default 0,
  add column if not exists guest_count          integer  not null default 10,
  add column if not exists ceremony_tier        text     not null default 'skip',
  add column if not exists reception_tier       text     not null default 'micro',
  add column if not exists guests_per_table     integer  not null default 8;

-- value-range constraints
alter table public.events
  add constraint events_wedding_party_pairs_range
    check (wedding_party_pairs between 0 and 15),
  add constraint events_guest_count_range
    check (guest_count between 10 and 250),
  add constraint events_ceremony_tier_valid
    check (ceremony_tier in ('skip', 'simple', 'standard', 'full')),
  add constraint events_reception_tier_valid
    check (reception_tier in ('micro', 'standard', 'lush'));

-- No RLS changes needed: the existing events update policy already covers
-- any columns on the events row for owner (user_id = auth.uid()).
