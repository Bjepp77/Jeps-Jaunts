-- ─────────────────────────────────────────────────────────────
-- 025 — Availability overrides + supplier defaults
--
-- florist_availability_overrides: per-florist flower/region/month
--   overrides that take precedence over seed seasonality data.
--
-- flower_supplier_defaults: per-florist preferred supplier for
--   each flower (used in recipe builder costing).
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

create table if not exists florist_availability_overrides (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  flower_id   uuid        not null references flowers(id) on delete cascade,
  region_id   uuid        not null references regions(id) on delete cascade,
  month       int2        not null
    constraint override_month_range check (month between 1 and 12),
  status      text        not null
    constraint override_status_check check (status in ('available', 'unavailable')),
  updated_at  timestamptz not null default now(),
  unique (user_id, flower_id, region_id, month)
);

create table if not exists flower_supplier_defaults (
  id           uuid     primary key default gen_random_uuid(),
  user_id      uuid     not null references auth.users(id) on delete cascade,
  flower_id    uuid     not null references flowers(id) on delete cascade,
  supplier_id  uuid     not null references suppliers(id) on delete cascade,
  is_preferred boolean  not null default true,
  unique (user_id, flower_id, supplier_id)
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────

create index florist_availability_overrides_user_id_idx
  on florist_availability_overrides (user_id);

create index florist_availability_overrides_flower_id_idx
  on florist_availability_overrides (flower_id);

create index flower_supplier_defaults_user_id_idx
  on flower_supplier_defaults (user_id);

create index flower_supplier_defaults_flower_id_idx
  on flower_supplier_defaults (flower_id);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table florist_availability_overrides enable row level security;
alter table flower_supplier_defaults       enable row level security;

-- florist_availability_overrides policies

create policy "Florist can read own overrides"
  on florist_availability_overrides for select
  using (auth.uid() = user_id);

create policy "Florist can insert own overrides"
  on florist_availability_overrides for insert
  with check (auth.uid() = user_id);

create policy "Florist can update own overrides"
  on florist_availability_overrides for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Florist can delete own overrides"
  on florist_availability_overrides for delete
  using (auth.uid() = user_id);

-- flower_supplier_defaults policies

create policy "Florist can read own supplier defaults"
  on flower_supplier_defaults for select
  using (auth.uid() = user_id);

create policy "Florist can insert own supplier defaults"
  on flower_supplier_defaults for insert
  with check (auth.uid() = user_id);

create policy "Florist can update own supplier defaults"
  on flower_supplier_defaults for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Florist can delete own supplier defaults"
  on flower_supplier_defaults for delete
  using (auth.uid() = user_id);
