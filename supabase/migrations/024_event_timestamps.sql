-- ── V2: Event Timestamps (Pipeline Step Tracking) ───────────────────────────
-- Tracks when a florist reaches each pipeline step for an event.
-- Powers the Hours Saved Dashboard (see ARCHITECTURE-V2.md §2).

create table if not exists event_timestamps (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references events(id) on delete cascade,
  step        text        not null
    constraint event_timestamps_step_check check (
      step in ('intake_received', 'recipes_started', 'recipes_finalized',
               'bom_generated', 'proposal_sent')
    ),
  occurred_at timestamptz not null default now(),
  unique (event_id, step)
);

create index event_timestamps_event_id_idx on event_timestamps(event_id);

alter table event_timestamps enable row level security;

-- Ownership check joins through events.user_id = auth.uid()

create policy "event_timestamps: owner select"
  on event_timestamps for select
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timestamps.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "event_timestamps: owner insert"
  on event_timestamps for insert
  to authenticated
  with check (
    exists (
      select 1 from events
      where events.id = event_timestamps.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "event_timestamps: owner update"
  on event_timestamps for update
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timestamps.event_id
        and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from events
      where events.id = event_timestamps.event_id
        and events.user_id = auth.uid()
    )
  );

create policy "event_timestamps: owner delete"
  on event_timestamps for delete
  to authenticated
  using (
    exists (
      select 1 from events
      where events.id = event_timestamps.event_id
        and events.user_id = auth.uid()
    )
  );
