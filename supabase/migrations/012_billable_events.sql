-- migration: create_billable_events
-- Records every proposal export. Used to drive per-event billing.
-- No payment processor at MVP — billing_status stays 'pending' until manual reconciliation.

CREATE TABLE IF NOT EXISTS billable_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users NOT NULL,
  event_id       UUID        REFERENCES events NOT NULL,
  exported_at    TIMESTAMPTZ DEFAULT now(),
  billing_status TEXT        DEFAULT 'pending'
                             CHECK (billing_status IN ('pending', 'billed', 'waived')),
  tier           TEXT        DEFAULT 'per_event'
                             CHECK (tier IN ('founding', 'per_event', 'subscription')),
  amount_cents   INTEGER     DEFAULT 500
);

ALTER TABLE billable_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own billing" ON billable_events
  FOR ALL USING (auth.uid() = user_id);

-- One charge per event: prevent duplicate pending/billed records for the same event
CREATE UNIQUE INDEX IF NOT EXISTS billable_events_event_id_active_idx
  ON billable_events(event_id)
  WHERE billing_status IN ('pending', 'billed');
