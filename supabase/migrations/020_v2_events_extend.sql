-- ── V2: Extend events table ────────────────────────────────────────────────────
-- Adds CRM fields, client info, vibe tags, and inquiry link

alter table events
  add column if not exists inquiry_id    uuid        references client_inquiries(id) on delete set null,
  add column if not exists lead_status   text        not null default 'new'
    constraint events_lead_status_check check (
      lead_status in ('new','contacted','proposal_sent','booked','completed')
    ),
  add column if not exists client_name   text,
  add column if not exists client_email  text,
  add column if not exists client_phone  text,
  add column if not exists venue         text,
  add column if not exists budget_cents  integer,
  add column if not exists vibe_tags_json jsonb not null default '[]';

create index if not exists events_inquiry_id_idx on events(inquiry_id);
create index if not exists events_lead_status_idx on events(lead_status);
