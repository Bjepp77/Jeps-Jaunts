-- ── V2: Florist Profiles ──────────────────────────────────────────────────────
-- Powers the public portal page at /portal/[slug]
-- One profile per florist, slug must be globally unique

create table if not exists florist_profiles (
  user_id         uuid        primary key references auth.users(id) on delete cascade,
  slug            text        not null unique
    constraint slug_format_check check (slug ~ '^[a-z0-9-]+$'),
  business_name   text,
  bio             text,
  contact_email   text,
  contact_phone   text,
  location        text,
  instagram_url   text,
  is_portal_live  boolean     not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index florist_profiles_slug_idx on florist_profiles(slug);

alter table florist_profiles enable row level security;

-- Florist manages their own profile
create policy "Florist manages own profile"
  on florist_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public can read live profiles (for portal page lookup by slug)
create policy "Public can read live profiles"
  on florist_profiles for select
  using (is_portal_live = true);
