-- ── event_estimates ───────────────────────────────────────────────────────────
--
-- Stores saved pricing estimates for events.
-- Strategy: multiple rows per event are allowed; the UI always loads the latest
-- row ordered by created_at DESC. This preserves history without needing a
-- composite unique constraint and avoids upsert-conflict edge cases.
--
-- price_book_version records which pricing config was used so future changes
-- to PRICE_BOOK don't silently alter historical estimates.

create table if not exists event_estimates (
  id                        uuid          primary key default gen_random_uuid(),
  event_id                  uuid          not null references events(id) on delete cascade,
  user_id                   uuid          not null references auth.users(id) on delete cascade,

  -- estimator inputs (stored so we can restore the form on next visit)
  wedding_party_pairs       integer       not null,
  ceremony_tier             text          not null,
  guest_count               integer       not null,
  reception_tier            text          not null,
  guests_per_table          integer       not null default 8,

  -- derived integer
  tables_count              integer       not null,

  -- pricing breakdown (all values already rounded to 2 decimal places by engine)
  personal_flowers_total    numeric(12,2) not null,
  ceremony_flowers_total    numeric(12,2) not null,
  reception_flowers_total   numeric(12,2) not null,
  design_fee                numeric(12,2) not null,
  sales_tax                 numeric(12,2) not null,
  design_fee_and_taxes_total numeric(12,2) not null,
  total_event_cost          numeric(12,2) not null,
  optional_delivery         numeric(12,2) not null,

  price_book_version        text          not null default 'v1',
  created_at                timestamptz   not null default now()
);

-- indexes
create index on event_estimates (event_id);
create index on event_estimates (user_id);
create index on event_estimates (event_id, created_at desc);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table event_estimates enable row level security;

-- Users can read, insert, update, and delete only their own estimates
create policy "Users can manage their own estimates"
  on event_estimates
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
