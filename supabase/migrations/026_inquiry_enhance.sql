-- ── V2: Intake Form Enhancements ─────────────────────────────────────────────
-- Adds guest count and color palette to client_inquiries and events

alter table client_inquiries
  add column if not exists guest_count          integer,
  add column if not exists color_palette        text,
  add column if not exists color_palette_custom  text;

alter table events
  add column if not exists guest_count          integer;
