-- ── Module 4: Cost Library + Margin Guardrails ───────────────────────────────

-- One pricing config row per user: tax rate + target gross margin
create table if not exists user_pricing_settings (
  user_id        uuid         primary key references auth.users(id) on delete cascade,
  tax_rate       numeric(6,4) not null default 0,
  target_margin  numeric(6,4) not null default 0,
  updated_at     timestamptz  not null default now(),
  constraint tax_rate_range    check (tax_rate    >= 0 and tax_rate    < 1),
  constraint target_margin_range check (target_margin >= 0 and target_margin < 1)
);

alter table user_pricing_settings enable row level security;

create policy "Users manage own pricing settings"
  on user_pricing_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-stem cost the florist pays at wholesale (their personal price book)
create table if not exists user_flower_costs (
  id            uuid          primary key default gen_random_uuid(),
  user_id       uuid          not null references auth.users(id) on delete cascade,
  flower_id     uuid          not null references flowers(id) on delete cascade,
  cost_per_stem numeric(10,4) not null,
  updated_at    timestamptz   not null default now(),
  unique (user_id, flower_id),
  constraint cost_per_stem_positive check (cost_per_stem >= 0)
);

alter table user_flower_costs enable row level security;

create policy "Users manage own flower costs"
  on user_flower_costs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
