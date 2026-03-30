-- ── V2: Extend flowers table ───────────────────────────────────────────────────
-- Adds source location and vibe tags (populated by admin via /admin)

alter table flowers
  add column if not exists default_source_location text,
  add column if not exists vibe_tags_json          jsonb not null default '[]';

-- Constraint on valid source location values (nullable — not all flowers tagged yet)
alter table flowers
  add constraint flowers_source_location_check
    check (
      default_source_location is null or
      default_source_location in ('local','california','dutch','south_america','other')
    );
