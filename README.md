# Fauna

A florist-focused event planning tool. Browse a database of flowers filtered by what's in season for your event date, build a flower cart, and export a supplier-ready order sheet.

---

## Features

- **Seasonality browser** — every flower is tagged with peak season and shoulder months; status is computed live from the event date (green / yellow / red)
- **Event planning** — create events with a name and date, browse and add flowers with quantity and notes
- **Export** — copy a plain-text order sheet to the clipboard or download a CSV

---

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) — Postgres database, Row Level Security, Auth (magic link)

---

## Environment variables

Create a `.env.local` file in the project root (copy from `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find these in your Supabase dashboard: **Project Settings → API**.

---

## Supabase dashboard setup

Before running the app, configure two things in **Authentication → URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/**` |

---

## Database setup

Run these two SQL files in order in the **Supabase SQL Editor**:

### 1. Schema + RLS

```
supabase/migrations/001_init.sql
```

Creates the `flowers`, `events`, and `event_items` tables with indexes and Row Level Security policies. Safe to re-run — drops and recreates tables.

### 2. Seed data

```
supabase/seed.sql
```

Inserts 45 flowers across focal, filler, greenery, and accent categories with realistic US seasonality data. Safe to re-run — truncates and re-inserts.

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Enter your email to receive a magic link.

---

## Project structure

```
app/
  page.tsx                  → redirects to /events
  login/page.tsx            → magic link login
  events/page.tsx           → event list + create/delete
  events/[id]/page.tsx      → event detail: flower browser + cart + export
  auth/callback/route.ts    → Supabase auth callback (PKCE exchange)
  auth/[...slug]/page.tsx   → fallback error page for bad auth URLs

src/
  components/
    SeasonBadge.tsx         → green/yellow/red status pill
    FlowerBrowser.tsx       → filterable flower list with Add button
    EventCart.tsx           → cart items with inline quantity/notes editing
    ExportPanel.tsx         → clipboard copy + CSV download
  lib/
    supabase.ts             → browser Supabase client (createBrowserClient)
    supabase-server.ts      → server Supabase client (createServerClient + cookies)
    seasonality.ts          → getSeasonStatus(), monthFromDate(), badge classes
  types/
    database.ts             → TypeScript interfaces for Flower, Event, EventItem

middleware.ts               → redirects unauthenticated users to /login

supabase/
  migrations/001_init.sql   → schema + RLS
  seed.sql                  → 45 flower records
```

---

## Data model

### `flowers`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| common_name | text | required |
| category | text | `focal` \| `filler` \| `greenery` \| `accent` |
| color_tags | text[] | e.g. `{white, blush, yellow}` |
| in_season_months | int2[] | months 1–12; peak availability |
| shoulder_months | int2[] | months 1–12; limited availability |
| notes | text | florist tips |

### `events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | required |
| event_date | date | required |

### `event_items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| flower_id | uuid | FK → flowers.id |
| quantity | integer | default 1 |
| notes | text | per-item notes for supplier |

---

## Seasonality logic

Given an event date, the event month (1–12) is extracted and compared against each flower's month arrays:

- `in_season_months` contains the month → **In Season** (green)
- `shoulder_months` contains the month → **Shoulder** (yellow)
- Neither → **Out of Season** (red)

Logic lives in [`src/lib/seasonality.ts`](src/lib/seasonality.ts).

---

## Wedding Flowers Estimator

A self-contained, local-only pricing estimator at `/estimator`. No Supabase or auth required — it runs entirely in the browser.

### Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/estimator](http://localhost:3000/estimator).

### Running the pricing engine tests

```bash
npm test          # run once (CI mode)
npm run test:watch  # watch mode during development
```

Tests use [Vitest](https://vitest.dev) in `node` environment (no DOM required). They cover:
- `roundCurrency` rounding correctness and IEEE 754 edge cases
- `tables = ceil(guestCount / 8)` with boundary inputs
- Ceremony tier skip logic
- Totals composition and no-double-rounding invariant

### Architecture

| File | Role |
|---|---|
| `src/lib/pricing/types.ts` | All domain types — no logic, no React imports |
| `src/lib/pricing/priceBook.ts` | **Single source of truth** for all prices/rates |
| `src/lib/pricing/calculate.ts` | Pure `calculate(inputs, book) → result` function |
| `src/lib/pricing/format.ts` | `Intl.NumberFormat` wrappers — used only in display |
| `src/components/Estimator/EstimatorPage.tsx` | `useReducer` host; calls `calculate()` on every render |
| `src/components/Estimator/InputPanel.tsx` | Left column — sliders + selects, dispatches actions |
| `src/components/Estimator/SummaryPanel.tsx` | Right column — read-only result display |
| `src/components/Estimator/controls/SliderField.tsx` | Accessible range input with ARIA attributes |
| `src/components/Estimator/controls/SelectField.tsx` | Accessible generic select |

**Why a reducer?** All input validation (value clamping) lives in one place. Derived values (`result`) are never stored in state — always recomputed from `calculate()`.

**To tune prices:** edit `src/lib/pricing/priceBook.ts` only. No other file contains pricing numbers.

---

## Adding more flowers

Add rows to [`supabase/seed.sql`](supabase/seed.sql) following the existing pattern, then re-run the file in the Supabase SQL Editor. The `TRUNCATE` at the top will reset and re-seed cleanly.
# Jeps-Jaunts
