-- migration: create_user_proposal_styles
-- Stores diffs between AI-generated drafts and florist edits.
-- Used to build a per-florist style profile that improves future AI generations.

CREATE TABLE IF NOT EXISTS user_proposal_styles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users NOT NULL,
  event_id   UUID        REFERENCES events NOT NULL,
  ai_draft   TEXT        NOT NULL,
  florist_edit TEXT      NOT NULL,
  diff_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_proposal_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own styles" ON user_proposal_styles
  FOR ALL USING (auth.uid() = user_id);
