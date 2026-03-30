-- migration: extend_ag_seasonality_suggestions
-- Adds source tracking, submitter identity, region text, and notes
-- to support florist-submitted corrections via /contribute.

ALTER TABLE ag_seasonality_suggestions
  ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'ai'
                                        CHECK (source IN ('ai', 'florist_submission', 'csv_import')),
  ADD COLUMN IF NOT EXISTS submitter_id UUID REFERENCES auth.users,
  ADD COLUMN IF NOT EXISTS region       TEXT,
  ADD COLUMN IF NOT EXISTS notes        TEXT;
