-- ── Module 5: Deliverables Calculator ────────────────────────────────────────

-- Global catalog of deliverable types with default recipe (stems by category)
create table if not exists deliverable_types (
  id                        uuid  primary key default gen_random_uuid(),
  name                      text  not null unique,
  display_name              text  not null,
  default_stems_by_category jsonb not null default '{"focal":0,"filler":0,"greenery":0,"accent":0}'
);

-- RLS: all authenticated users can read; only admins (or no one) can write
alter table deliverable_types enable row level security;
create policy "Anyone can read deliverable types"
  on deliverable_types for select using (auth.uid() is not null);

-- Seed default deliverable types
insert into deliverable_types (name, display_name, default_stems_by_category) values
  ('bridal_bouquet',     'Bridal Bouquet',     '{"focal":8,"filler":12,"greenery":6,"accent":4}'),
  ('bridesmaid_bouquet', 'Bridesmaid Bouquet', '{"focal":5,"filler":8,"greenery":4,"accent":2}'),
  ('boutonniere',        'Boutonniere',        '{"focal":2,"filler":2,"greenery":1,"accent":1}'),
  ('corsage',            'Corsage',            '{"focal":2,"filler":3,"greenery":2,"accent":1}'),
  ('centerpiece',        'Centerpiece',        '{"focal":5,"filler":8,"greenery":5,"accent":3}'),
  ('ceremony_arch',      'Ceremony Arch',      '{"focal":25,"filler":35,"greenery":40,"accent":15}'),
  ('flower_crown',       'Flower Crown',       '{"focal":5,"filler":8,"greenery":8,"accent":4}'),
  ('bud_vase',           'Bud Vase',           '{"focal":2,"filler":2,"greenery":2,"accent":0}'),
  ('table_runner',       'Table Runner',       '{"focal":3,"filler":5,"greenery":6,"accent":2}')
on conflict (name) do nothing;

-- User-level recipe overrides (optional — overrides a single deliverable type's recipe)
create table if not exists user_recipe_templates (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  deliverable_type_id uuid        not null references deliverable_types(id) on delete cascade,
  stems_by_category   jsonb       not null,
  updated_at          timestamptz not null default now(),
  unique (user_id, deliverable_type_id)
);

alter table user_recipe_templates enable row level security;
create policy "Users manage own recipe templates"
  on user_recipe_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-event deliverable quantities (how many of each type for this event)
create table if not exists event_deliverables (
  id                  uuid        primary key default gen_random_uuid(),
  event_id            uuid        not null references events(id) on delete cascade,
  deliverable_type_id uuid        not null references deliverable_types(id) on delete cascade,
  quantity            integer     not null default 1
    constraint event_deliverables_qty_min check (quantity >= 1),
  created_at          timestamptz not null default now(),
  unique (event_id, deliverable_type_id)
);

alter table event_deliverables enable row level security;
create policy "Users manage own event deliverables"
  on event_deliverables for all
  using (
    exists (select 1 from events e where e.id = event_id and e.user_id = auth.uid())
  )
  with check (
    exists (select 1 from events e where e.id = event_id and e.user_id = auth.uid())
  );

-- ── Module 6: Community Availability Signals ──────────────────────────────────

-- One vote per user per flower — 'in' (seeing it) or 'out' (not seeing it)
create table if not exists community_availability_votes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  flower_id  uuid        not null references flowers(id) on delete cascade,
  vote       text        not null constraint vote_values check (vote in ('in', 'out')),
  created_at timestamptz not null default now(),
  unique (user_id, flower_id)
);

alter table community_availability_votes enable row level security;

-- All authenticated users can read votes (aggregated display only)
create policy "Anyone can read votes"
  on community_availability_votes for select
  using (auth.uid() is not null);

create policy "Users insert own votes"
  on community_availability_votes for insert
  with check (auth.uid() = user_id);

create policy "Users update own votes"
  on community_availability_votes for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own votes"
  on community_availability_votes for delete
  using (auth.uid() = user_id);

-- Aggregate view: counts + 30-day "seeing it" signal
create or replace view flower_availability_signals as
select
  flower_id,
  count(*)                                                              as vote_count,
  count(*) filter (where vote = 'in') - count(*) filter (where vote = 'out') as net_score,
  count(*) filter (where vote = 'in'
                   and created_at > now() - interval '30 days')        as in_count_30d
from community_availability_votes
group by flower_id;
