-- ── V2: Recipe Defaults & Per-Event Recipes ───────────────────────────────────
-- recipe_defaults: the florist's 3-5-8 ratio per deliverable type
-- event_recipes: per-event overrides of those defaults (locked when finalized)

create table if not exists recipe_defaults (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  deliverable_type  text        not null,
  focal_count       integer     not null default 3,
  filler_count      integer     not null default 5,
  green_count       integer     not null default 8,
  accent_count      integer     not null default 2,
  updated_at        timestamptz not null default now(),
  unique (user_id, deliverable_type)
);

alter table recipe_defaults enable row level security;

create policy "Users manage own recipe defaults"
  on recipe_defaults for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-event recipe overrides (locked when florist clicks "Finalize Recipes")
create table if not exists event_recipes (
  id                uuid        primary key default gen_random_uuid(),
  event_id          uuid        not null references events(id) on delete cascade,
  deliverable_type  text        not null,
  quantity          integer     not null default 1
    constraint event_recipes_qty_min check (quantity >= 1),
  focal_count       integer     not null default 3,
  filler_count      integer     not null default 5,
  green_count       integer     not null default 8,
  accent_count      integer     not null default 2,
  locked_at         timestamptz,
  created_at        timestamptz not null default now(),
  unique (event_id, deliverable_type)
);

create index event_recipes_event_id_idx on event_recipes(event_id);

alter table event_recipes enable row level security;

create policy "Users manage own event recipes"
  on event_recipes for all
  using (
    exists (
      select 1 from events e
      where e.id = event_recipes.event_id
        and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events e
      where e.id = event_recipes.event_id
        and e.user_id = auth.uid()
    )
  );
