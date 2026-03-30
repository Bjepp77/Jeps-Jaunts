-- ──────────────────────────────────────────────────────────────────────────────
-- 008_quotes.sql
-- Planner → Estimate → Quote → Export flow
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. event_quotes (one row per saved version) ───────────────────────────────
create table event_quotes (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references events(id) on delete cascade,
  version         integer not null default 1,
  label           text,                          -- optional human label
  source          text not null check (source in ('estimator', 'cart')),
  status          text not null default 'draft'
                    check (status in ('draft', 'sent', 'accepted', 'rejected')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (event_id, version)
);

-- ── 2. event_quote_inputs (estimator slider snapshot) ────────────────────────
create table event_quote_inputs (
  id                    uuid primary key default gen_random_uuid(),
  quote_id              uuid not null references event_quotes(id) on delete cascade,
  wedding_party_pairs   integer not null default 0,
  ceremony_tier         text not null default 'skip',
  guest_count           integer not null default 100,
  reception_tier        text not null default 'standard',
  created_at            timestamptz not null default now()
);

-- ── 3. event_quote_documents (generated proposal text) ───────────────────────
create table event_quote_documents (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references event_quotes(id) on delete cascade,
  doc_type        text not null default 'proposal' check (doc_type in ('proposal', 'order_sheet')),
  body            text not null,
  florist_name    text not null default '',
  client_name     text not null default '',
  event_date_str  text not null default '',
  venue           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 4. event_quote_line_items (per-flower cost rows) ─────────────────────────
create table event_quote_line_items (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references event_quotes(id) on delete cascade,
  flower_id       uuid references flowers(id) on delete set null,
  description     text not null,
  quantity        integer not null default 1,
  unit_price_cents integer not null default 0,
  total_cents     integer not null default 0,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ── 5. active_quote per event ─────────────────────────────────────────────────
create table event_active_quotes (
  event_id        uuid primary key references events(id) on delete cascade,
  quote_id        uuid references event_quotes(id) on delete set null,
  updated_at      timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on event_quotes (event_id);
create index on event_quote_inputs (quote_id);
create index on event_quote_documents (quote_id);
create index on event_quote_line_items (quote_id, sort_order);

-- ── Updated_at trigger (reuse pattern) ───────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger event_quotes_updated_at
  before update on event_quotes
  for each row execute function set_updated_at();

create trigger event_quote_documents_updated_at
  before update on event_quote_documents
  for each row execute function set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table event_quotes           enable row level security;
alter table event_quote_inputs     enable row level security;
alter table event_quote_documents  enable row level security;
alter table event_quote_line_items enable row level security;
alter table event_active_quotes    enable row level security;

-- event_quotes: user owns if they own the parent event
create policy "user owns event_quotes"
  on event_quotes for all
  using (
    exists (
      select 1 from events
      where events.id = event_quotes.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_quotes.event_id
        and events.user_id = auth.uid()
    )
  );

-- event_quote_inputs: access via parent quote → event ownership
create policy "user owns event_quote_inputs"
  on event_quote_inputs for all
  using (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_inputs.quote_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_inputs.quote_id
        and e.user_id = auth.uid()
    )
  );

-- event_quote_documents
create policy "user owns event_quote_documents"
  on event_quote_documents for all
  using (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_documents.quote_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_documents.quote_id
        and e.user_id = auth.uid()
    )
  );

-- event_quote_line_items
create policy "user owns event_quote_line_items"
  on event_quote_line_items for all
  using (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_line_items.quote_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_quotes q
        join events e on e.id = q.event_id
      where q.id = event_quote_line_items.quote_id
        and e.user_id = auth.uid()
    )
  );

-- event_active_quotes
create policy "user owns event_active_quotes"
  on event_active_quotes for all
  using (
    exists (
      select 1 from events
      where events.id = event_active_quotes.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_active_quotes.event_id
        and events.user_id = auth.uid()
    )
  );
