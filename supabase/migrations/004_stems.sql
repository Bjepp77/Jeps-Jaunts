-- ── Module 3: Stems + Bunch Counts ───────────────────────────────────────────

-- Add stems to event_items; seed from existing quantity values
alter table event_items
  add column if not exists stems integer not null default 1
    constraint event_items_stems_min check (stems >= 1);

-- Seed from existing quantity so no data is lost
update event_items set stems = quantity where quantity > 1 and stems = 1;

-- ── Per-flower bunch-size default ─────────────────────────────────────────────
alter table flowers
  add column if not exists stems_per_bunch_default integer not null default 10
    constraint flowers_spb_min check (stems_per_bunch_default >= 1);

-- ── User-level bunch-size overrides ──────────────────────────────────────────
-- A florist can override stems_per_bunch for any flower (e.g. spray roses
-- often come 10/bunch but their preferred grower does 12).

create table if not exists user_flower_prefs (
  id                       uuid        primary key default gen_random_uuid(),
  user_id                  uuid        not null references auth.users(id) on delete cascade,
  flower_id                uuid        not null references flowers(id) on delete cascade,
  stems_per_bunch_override integer     not null
    constraint user_flower_prefs_spb_min check (stems_per_bunch_override >= 1),
  created_at               timestamptz not null default now(),
  unique (user_id, flower_id)
);

alter table user_flower_prefs enable row level security;

create policy "Users manage own flower prefs"
  on user_flower_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
