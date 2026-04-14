-- ── V2: Recipe Items ──────────────────────────────────────────────────────────
-- Stores which flowers go into each deliverable recipe for an event.
-- Ownership is determined by joining through events.user_id.

create table if not exists recipe_items (
  id                uuid        primary key default gen_random_uuid(),
  event_id          uuid        not null references events(id) on delete cascade,
  deliverable_type  text        not null,
  flower_id         uuid        not null references flowers(id) on delete cascade,
  stems_per_unit    integer     not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (event_id, deliverable_type, flower_id)
);

create index recipe_items_event_id_idx  on recipe_items(event_id);
create index recipe_items_flower_id_idx on recipe_items(flower_id);

alter table recipe_items enable row level security;

-- RLS: CRUD only when the parent event belongs to auth.uid()

create policy "recipe_items: owner select"
  on recipe_items for select
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = recipe_items.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "recipe_items: owner insert"
  on recipe_items for insert
  to authenticated
  with check (
    exists (
      select 1 from events
      where events.id = recipe_items.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "recipe_items: owner update"
  on recipe_items for update
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = recipe_items.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = recipe_items.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "recipe_items: owner delete"
  on recipe_items for delete
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = recipe_items.event_id
        and events.user_id = auth.uid()
    )
  );
