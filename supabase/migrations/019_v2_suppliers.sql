-- ── V2: Supplier Management & Price History ───────────────────────────────────

create table if not exists suppliers (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  name            text        not null,
  source_location text        not null default 'other'
    constraint suppliers_source_location_check check (
      source_location in ('local','california','dutch','south_america','other')
    ),
  contact_info    text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index suppliers_user_id_idx on suppliers(user_id);

alter table suppliers enable row level security;

create policy "Users manage own suppliers"
  on suppliers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-BOM-save: auto-inserted whenever the florist approves a BOM
-- Records which supplier, at what price, for which flower
create table if not exists flower_supplier_prices (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        not null references auth.users(id) on delete cascade,
  flower_id             uuid        not null references flowers(id) on delete cascade,
  supplier_id           uuid        not null references suppliers(id) on delete cascade,
  price_per_stem_cents  integer     not null,
  bunch_size            integer,
  recorded_at           timestamptz not null default now(),
  event_id              uuid        references events(id) on delete set null
);

create index fsp_user_flower_idx on flower_supplier_prices(user_id, flower_id);
create index fsp_supplier_idx on flower_supplier_prices(supplier_id);
create index fsp_recorded_at_idx on flower_supplier_prices(recorded_at desc);

alter table flower_supplier_prices enable row level security;

create policy "Users manage own supplier prices"
  on flower_supplier_prices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
