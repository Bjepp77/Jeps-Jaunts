-- ── Module 7: Public Agricultural Data Ingestion ─────────────────────────────
-- Run in Supabase SQL Editor.  Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- Design principles:
--   • ag suggestions are READ-ONLY proposals — they never auto-write to region_flower_seasonality
--   • Accepting a suggestion is an admin-only explicit action
--   • A suggestion for a flower that already has CSV-sourced data is shown as a conflict
--     and cannot be accepted without first deleting the existing regional row
--   • RLS restricts writes to users where (auth.jwt()->'app_metadata'->>'is_admin') = 'true'
--     Set this flag via Supabase Dashboard → Authentication → Users → Edit → app_metadata

-- ── Registry of public data sources ──────────────────────────────────────────
create table if not exists ag_data_sources (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null unique,
  url           text,
  notes         text,
  last_ingested timestamptz,
  created_at    timestamptz not null default now()
);

-- Seed one well-known public source as an example
insert into ag_data_sources (name, url, notes) values
  (
    'USDA AMS Specialty Crops',
    'https://apps.ams.usda.gov/mnreports/fvwretail.pdf',
    'USDA Agricultural Marketing Service wholesale market price reports'
  )
on conflict (name) do nothing;

-- ── Seasonality suggestions from public data ──────────────────────────────────
create table if not exists ag_seasonality_suggestions (
  id                        uuid         primary key default gen_random_uuid(),
  source_id                 uuid         references ag_data_sources(id) on delete set null,
  region_id                 uuid         not null references regions(id) on delete cascade,
  flower_id                 uuid         not null references flowers(id) on delete cascade,
  suggested_in_months       int2[]       not null default '{}',
  suggested_shoulder_months int2[]       not null default '{}',
  confidence                numeric(4,2) check (confidence between 0 and 1),
  notes                     text,
  status                    text         not null default 'pending'
    constraint ag_suggestion_status check (status in ('pending', 'accepted', 'rejected')),
  reviewed_by               uuid         references auth.users(id) on delete set null,
  reviewed_at               timestamptz,
  created_at                timestamptz  not null default now(),
  unique (region_id, flower_id, source_id)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table ag_data_sources          enable row level security;
alter table ag_seasonality_suggestions enable row level security;

-- Sources: any authenticated user may read
create policy "auth_read_ag_sources"
  on ag_data_sources for select
  using (auth.uid() is not null);

-- Sources: admin-only writes
create policy "admin_write_ag_sources"
  on ag_data_sources for all
  using  ((auth.jwt()->'app_metadata'->>'is_admin')::boolean = true)
  with check ((auth.jwt()->'app_metadata'->>'is_admin')::boolean = true);

-- Suggestions: any authenticated user may read
create policy "auth_read_ag_suggestions"
  on ag_seasonality_suggestions for select
  using (auth.uid() is not null);

-- Suggestions: admin-only writes
create policy "admin_write_ag_suggestions"
  on ag_seasonality_suggestions for all
  using  ((auth.jwt()->'app_metadata'->>'is_admin')::boolean = true)
  with check ((auth.jwt()->'app_metadata'->>'is_admin')::boolean = true);
