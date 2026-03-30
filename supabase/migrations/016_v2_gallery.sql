-- ── V2: Gallery Items ──────────────────────────────────────────────────────────
-- Florist-uploaded event photos for the public portal gallery

create table if not exists gallery_items (
  id            uuid        primary key default gen_random_uuid(),
  florist_id    uuid        not null references auth.users(id) on delete cascade,
  storage_path  text        not null,
  caption       text,
  vibe_tags_json jsonb      not null default '[]',
  event_date    date,
  is_visible    boolean     not null default true,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index gallery_items_florist_id_idx on gallery_items(florist_id);
create index gallery_items_sort_order_idx on gallery_items(florist_id, sort_order);

alter table gallery_items enable row level security;

-- Florist manages their own gallery
create policy "Florist manages own gallery"
  on gallery_items for all
  using (auth.uid() = florist_id)
  with check (auth.uid() = florist_id);

-- Public can read visible gallery items (for the portal page — uses florist_id lookup)
create policy "Public can read visible gallery items"
  on gallery_items for select
  using (is_visible = true);
