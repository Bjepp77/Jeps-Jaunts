-- ── Module 2: Wholesaler Availability Paste ──────────────────────────────────
-- Stores raw paste text; one active "global" paste per user at a time.

create table if not exists availability_pastes (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  scope      text        not null default 'global',
  raw_text   text        not null,
  created_at timestamptz not null default now()
);

alter table availability_pastes enable row level security;

create policy "Users manage own pastes"
  on availability_pastes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Parsed matches from a paste ───────────────────────────────────────────────
-- Each row links one paste to one matched flower.

create table if not exists availability_matches (
  id         uuid        primary key default gen_random_uuid(),
  paste_id   uuid        not null references availability_pastes(id) on delete cascade,
  flower_id  uuid        not null references flowers(id) on delete cascade,
  confidence text        not null default 'substring', -- 'exact' | 'substring'
  created_at timestamptz not null default now(),
  unique (paste_id, flower_id)
);

alter table availability_matches enable row level security;

-- Read / write gated through paste ownership
create policy "Users read own availability matches"
  on availability_matches for select
  using (
    exists (
      select 1 from availability_pastes ap
      where ap.id = paste_id and ap.user_id = auth.uid()
    )
  );

create policy "Users insert own availability matches"
  on availability_matches for insert
  with check (
    exists (
      select 1 from availability_pastes ap
      where ap.id = paste_id and ap.user_id = auth.uid()
    )
  );

create policy "Users delete own availability matches"
  on availability_matches for delete
  using (
    exists (
      select 1 from availability_pastes ap
      where ap.id = paste_id and ap.user_id = auth.uid()
    )
  );
