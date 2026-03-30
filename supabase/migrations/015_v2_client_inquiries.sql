-- ── V2: Client Inquiries & Intake Photos ──────────────────────────────────────
-- Client-submitted inquiry forms that auto-create draft events

create table if not exists client_inquiries (
  id                  uuid        primary key default gen_random_uuid(),
  florist_id          uuid        not null references auth.users(id) on delete cascade,
  client_name         text        not null,
  email               text        not null,
  phone               text,
  event_date          date        not null,
  venue               text,
  budget_cents        integer,
  event_type          text        not null default 'wedding'
    constraint inquiry_event_type_check check (event_type in ('wedding','corporate','other')),
  deliverables_json   jsonb       not null default '[]',
  notes               text,
  vibe_tags_json      jsonb       not null default '[]',
  status              text        not null default 'new'
    constraint inquiry_status_check check (status in ('new','contacted','proposal_sent','booked','completed')),
  submitted_at        timestamptz not null default now(),
  source_ip           text
);

create index client_inquiries_florist_id_idx on client_inquiries(florist_id);
create index client_inquiries_status_idx on client_inquiries(status);

alter table client_inquiries enable row level security;

-- Florist can read/update their own inquiries
create policy "Florist can read own inquiries"
  on client_inquiries for select
  using (auth.uid() = florist_id);

create policy "Florist can update own inquiries"
  on client_inquiries for update
  using (auth.uid() = florist_id)
  with check (auth.uid() = florist_id);

create policy "Florist can delete own inquiries"
  on client_inquiries for delete
  using (auth.uid() = florist_id);

-- Anyone (anon) can submit an inquiry (intake form is public-facing)
create policy "Anyone can submit inquiry"
  on client_inquiries for insert
  with check (true);

-- ── Inquiry photos (inspiration images uploaded by the client) ─────────────────

create table if not exists inquiry_photos (
  id                          uuid        primary key default gen_random_uuid(),
  inquiry_id                  uuid        not null references client_inquiries(id) on delete cascade,
  storage_path                text        not null,
  haiku_vibe_tags_json        jsonb       not null default '[]',
  florist_confirmed_tags_json jsonb,
  uploaded_at                 timestamptz not null default now()
);

create index inquiry_photos_inquiry_id_idx on inquiry_photos(inquiry_id);

alter table inquiry_photos enable row level security;

-- Florist can read photos for their own inquiries
create policy "Florist can read own inquiry photos"
  on inquiry_photos for select
  using (
    exists (
      select 1 from client_inquiries ci
      where ci.id = inquiry_photos.inquiry_id
        and ci.florist_id = auth.uid()
    )
  );

-- Anyone can insert (client uploading)
create policy "Anyone can upload inquiry photos"
  on inquiry_photos for insert
  with check (true);

create policy "Florist can update own inquiry photos"
  on inquiry_photos for update
  using (
    exists (
      select 1 from client_inquiries ci
      where ci.id = inquiry_photos.inquiry_id
        and ci.florist_id = auth.uid()
    )
  );
