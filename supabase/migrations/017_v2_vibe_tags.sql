-- ── V2: Flower Vibe Tags ───────────────────────────────────────────────────────
-- Many-to-many: each flower can have 1–3 vibe tags from the V1 taxonomy

create table if not exists flower_vibe_tags (
  flower_id   uuid  not null references flowers(id) on delete cascade,
  vibe_tag    text  not null
    constraint vibe_tag_check check (
      vibe_tag in ('romantic','garden','modern','moody','boho','classic','tropical','minimalist')
    ),
  primary key (flower_id, vibe_tag)
);

create index flower_vibe_tags_vibe_tag_idx on flower_vibe_tags(vibe_tag);

alter table flower_vibe_tags enable row level security;

-- All authenticated users can read (used in flower browser filtering)
create policy "Authenticated users can read flower vibe tags"
  on flower_vibe_tags for select
  using (auth.uid() is not null);

-- Only admins can write vibe tags (set in /admin)
create policy "Admins can manage flower vibe tags"
  on flower_vibe_tags for all
  using (
    coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) = true
  )
  with check (
    coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false) = true
  );
