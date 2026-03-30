-- migration: extend_availability_matches
-- Adds confidence scoring and source text to support structured wholesaler ingestion.

ALTER TABLE availability_matches
  ADD COLUMN IF NOT EXISTS confidence_score FLOAT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_text      TEXT     DEFAULT NULL;
