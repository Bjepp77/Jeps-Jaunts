# Fauna v2 — Architecture Plan

**Goal:** Strip Fauna to its core value loop and make it flawless. A bride fills out an intake form that captures the real scope of her wedding. That information flows directly into a recipe builder where the florist plans arrangements with in-season flowers. The recipes generate a professional proposal and a wholesale BOM. A cumulative hours-saved dashboard makes the value tangible.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, Auth, RLS, Storage). No changes to the stack. No Python rewrite.

**Timeline:** 3-week sprint starting post-classes (approx. April 21, 2026).

**First user:** Your wife, running a real wedding through it end-to-end.

---

## 1. The Core Pipeline

Everything in Fauna v2 serves this flow:

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐     ┌────────────┐
│  Client       │────▶│  Recipe Builder    │────▶│  Price &     │────▶│  Proposal  │
│  Intake Form  │     │  (unified screen)  │     │  BOM         │     │  + Export   │
└──────────────┘     └───────────────────┘     └──────────────┘     └────────────┘
       │                      │                        │                    │
       ▼                      ▼                        ▼                    ▼
  Auto-creates           Seasonality              Supplier prices      AI-generated
  event with             informs every            auto-populate        with style
  deliverables           flower suggestion        from history         learning
  pre-populated
```

### 1.1 Client Intake Form (exists — polish)

**Current state:** Solid. Captures name, email, phone, event date, venue, budget, deliverables with quantities, notes, inspiration photos. AI vibe classification on submit.

**Changes needed:**

- **Guest count field** — Add between venue and budget. Drives centerpiece/table count math (tables = ceil(guests / 8)).
- **Color palette selector** — Replace the free-text notes field with a structured color palette picker (6-8 preset palettes: blush & ivory, jewel tones, earth tones, all white, etc.) plus a "describe your own" text field. This gives the florist structured data to work with instead of parsing "I want like, romantic vibes with pinks."
- **Smart deliverable defaults** — When a bride selects "Wedding" as event type, pre-populate reasonable deliverable suggestions based on guest count (e.g., guest count 150 → suggest 19 centerpieces, 1 bridal bouquet, etc.). She can adjust from there.
- **Photo upload** — Swap URL paste inputs for actual file upload to Supabase Storage. Brides don't have URLs to their Pinterest screenshots. Use a drag-and-drop zone.
- **Confirmation screen** — After submit, show a summary of what they submitted with estimated response time. Not just "Thank you!" — show them their own data back so they trust it went through.

**File:** `src/components/IntakeForm.tsx` — edit in place.

### 1.2 Inquiry → Event Bridge (exists — wire up)

**Current state:** The `client_inquiries` table and `events.inquiry_id` FK exist. The `020_v2_events_extend.sql` migration already added client fields to events.

**What's missing:** An automatic bridge. When an inquiry comes in, it should auto-create a draft event with:
- Event name = "{Client Name} Wedding"
- Event date from inquiry
- Venue, budget, client contact info copied over
- Deliverables from `deliverables_json` parsed into `event_items` or the deliverable quantities system
- Lead status = "new"
- Vibe tags from AI classification (when ready)

**Implementation:** Server action in `src/lib/save-inquiry-action.ts` — after saving the inquiry, create the event and link them. The florist opens their dashboard, sees the new event with everything pre-populated, and jumps straight into recipe planning.

### 1.3 Recipe Builder (rebuild — merge RecipesScreen + BuildScreen)

**Current state:** Two separate screens doing overlapping work. RecipesScreen sets stem counts by category (focal/filler/greens/accent) per deliverable. BuildScreen picks specific flowers and manages a cart. They should be one unified experience.

**The new Recipe Builder is a single screen with three panels:**

```
┌─────────────────┬──────────────────────────────┬──────────────────┐
│  DELIVERABLES   │  FLOWER BROWSER               │  RECIPE CARD     │
│                 │                                │                  │
│  Bridal Bouquet │  [Search] [Category ▾]         │  Bridal Bouquet  │
│    × 1          │  [Season ▾] [Color ▾]          │  ──────────────  │
│                 │                                │  Garden Rose ×12 │
│  Bridesmaid     │  ┌─────────────────────────┐  │  Ranunculus  ×6  │
│  Bouquet × 4    │  │ Garden Rose       🟢    │  │  Eucalyptus  ×8  │
│                 │  │ Ecuador Import          │  │                  │
│  Centerpiece    │  │ $1.80/stem (Red Mtn)    │  │  26 stems/unit   │
│    × 19         │  │            [+ Add]      │  │  × 1 = 26 total  │
│                 │  ├─────────────────────────┤  │                  │
│  Ceremony Arch  │  │ Ranunculus        🟡    │  │  ──────────────  │
│    × 1          │  │ Shoulder season         │  │  [Save Draft]    │
│                 │  │ $2.40/stem (Ecuador)    │  │  [Next →]        │
│  Boutonniere    │  │            [+ Add]      │  │                  │
│    × 6          │  └─────────────────────────┘  │                  │
│                 │                                │                  │
│  ────────────── │  🟢 In Season  🟡 Shoulder     │                  │
│  RUNNING TOTALS │  🔴 Out of Season              │                  │
│  Focal: 156     │                                │                  │
│  Filler: 89     │                                │                  │
│  Greens: 124    │                                │                  │
└─────────────────┴──────────────────────────────┴──────────────────┘
```

**Key behaviors:**

- **Left panel (Deliverables):** Pre-populated from intake. Quantities are editable. Selecting a deliverable type activates its recipe card on the right.
- **Center panel (Flower Browser):** Filterable by category, color, season status. Each flower card shows: name, season badge (green/yellow/red for event month + region), supplier source, last known price per stem. The "[+ Add]" button adds the flower to the active recipe card.
- **Right panel (Recipe Card):** Shows the recipe for the selected deliverable. Each flower has a stem count input. Running totals update live. "Save Draft" persists. "Next →" advances to the next deliverable type, or to the Price/BOM screen when all recipes are built.
- **Season status is the hero.** The badge must be prominent and impossible to miss. If a flower is out of season, the card should show it in muted/faded styling with a clear "Out of Season — consider alternatives" callout. Don't hide out-of-season flowers (the florist might source them at higher cost), but make the seasonal preference unmistakable.
- **Supplier + price context inline.** If the florist has logged a price from Red Mountain or the Ecuador farm for this flower, show it right on the flower card. This eliminates the mental lookup of "can I afford this in this recipe?"

**Data flow:** The recipe builder writes to a `recipe_items` table (or extends `event_items`):

```
recipe_items
├── id (uuid, PK)
├── event_id (uuid, FK → events)
├── deliverable_type (text)  — e.g., "bridal_bouquet"
├── flower_id (uuid, FK → flowers)
├── stems_per_unit (integer) — stems of this flower per single arrangement
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

The deliverable quantity lives on the event (how many bridal bouquets). The recipe says what goes in each one. Total stems = stems_per_unit × deliverable_quantity.

**Files to create/modify:**
- `src/components/RecipeBuilder/RecipeBuilder.tsx` — new unified component
- `src/components/RecipeBuilder/DeliverablePanel.tsx` — left panel
- `src/components/RecipeBuilder/FlowerBrowserPanel.tsx` — center panel (refactor from existing FlowerBrowser)
- `src/components/RecipeBuilder/RecipeCard.tsx` — right panel
- Delete: `src/components/EventFlow/RecipesScreen.tsx`
- Delete: `src/components/EventFlow/BuildScreen.tsx`

### 1.4 Price & BOM (exists — streamline)

**Current state:** PriceScreen is actually well-built. It already does BOM with margin calculation, supplier price logging, source location filtering, and quote versioning.

**Changes needed:**

- **Auto-populate from recipes.** Currently the BOM is derived from the cart. In v2, it should aggregate from all recipe_items across all deliverables: for each flower, total stems = sum(stems_per_unit × deliverable_qty). Group by flower, then by supplier.
- **Bunch rounding.** Show stems needed AND bunches needed (stems / stems_per_bunch, rounded up). This is what the wholesaler actually sells.
- **Supplier assignment.** For each flower, suggest a default supplier based on the florist's previous orders (most recent supplier for that flower). Let her override per-flower.
- **Two views:** "Client View" (proposal-friendly, shows retail pricing) and "Wholesale View" (BOM for ordering, shows cost + quantities by supplier). Toggle between them.
- **Export BOM as CSV.** One click, grouped by supplier. Headers: Supplier, Flower, Stems Needed, Bunches, Price/Stem, Line Total. This is what she sends to Red Mountain and the Ecuador farm.

**File:** `src/components/EventFlow/PriceScreen.tsx` — refactor in place.

### 1.5 Proposal Generator (exists — keep as-is)

**Current state:** ProposalEditor with AI generation, style learning from florist edits, client info fields, copy/download export. This is a genuine differentiator.

**Changes needed (minor):**

- **Pull client info from the event record** (auto-fill florist name, client name, event date, venue instead of requiring manual entry).
- **PDF export** in addition to plain text download. Use the proposal body to generate a branded PDF with the florist's logo and color scheme.
- **Proposal link** — Generate a unique URL the florist can send to the bride. The bride sees a read-only, beautifully formatted proposal page (reuse portal styling).

**File:** `src/components/EventFlow/ProposalEditor.tsx` — minor edits.

---

## 2. Hours Saved Dashboard

This is the value metric that turns a tool into a habit.

### 2.1 Benchmark Assumptions

Based on typical florist workflow (manual process via spreadsheets + pen/paper):

| Pipeline Step | Manual Time | Fauna Time | Savings |
|---|---|---|---|
| Intake review & data entry | 20 min | 0 min (auto from form) | 20 min |
| Seasonality research per flower | 5 min × ~15 flowers = 75 min | 0 min (built-in) | 75 min |
| Recipe building (stem counts, arrangement math) | 45 min | 15 min | 30 min |
| Price calculation & margin math | 30 min | 2 min | 28 min |
| BOM assembly for wholesalers | 20 min | 1 min (auto-generated) | 19 min |
| Proposal writing & formatting | 40 min | 10 min (AI + template) | 30 min |
| **Total per event** | **~3.5 hours** | **~28 min** | **~3 hours** |

### 2.2 Tracking Mechanism

Track timestamps at each pipeline step transition:

```
event_timestamps
├── event_id (uuid, FK → events)
├── step (text) — 'intake_received', 'recipes_started', 'recipes_finalized',
│                  'bom_generated', 'proposal_sent'
├── occurred_at (timestamptz)
```

Calculate actual time spent in each step. Compare against benchmarks. The dashboard shows:
- **Cumulative hours saved** — big number, front and center on the main events page
- **Per-event breakdown** — when you click into an event, see the time savings for that wedding
- **Trend line** — hours saved per month, showing the florist she's getting faster as she uses it

### 2.3 Dashboard Component

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   ┌──────────────────────────────────────┐        │
│   │                                      │        │
│   │     47.5 hours saved                 │        │
│   │     ═══════════════                  │        │
│   │     across 16 events this year       │        │
│   │                                      │        │
│   │     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░        │        │
│   │     68% time reduction               │        │
│   │                                      │        │
│   └──────────────────────────────────────┘        │
│                                                    │
│   This month    ▸ 12.3 hrs saved (4 events)       │
│   Last month    ▸  9.1 hrs saved (3 events)       │
│   Avg per event ▸  3.0 hrs saved                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**File:** `src/components/HoursSavedDashboard.tsx` — new component.

---

## 3. Seasonality Infrastructure

### 3.1 Seed Data Strategy

The `region_flower_seasonality` table already exists with the right schema. What's needed is real data.

**Phase 1 — Manual seed for Utah / Mountain West:**
- Research: Mayesh availability calendar, DVFlora seasonal guides, FiftyFlowers wholesale catalog
- Map each of the 45 seed flowers to: peak months (in_season_months) and shoulder months (shoulder_months) for the "Mountain West" region
- Tag flowers with likely source: "local" (Red Mountain / Utah growers), "south_america" (Ecuador farm), "california" (CA wholesale), "dutch" (Dutch import)
- Store source info on the flower record or via a `flower_suppliers` junction table

**Phase 2 — Inline correction (replaces community contribution page):**
- In the Recipe Builder, each flower card has a small "Flag availability" action
- Florist can mark: "Available in my area" or "Not available" for the current month
- This writes to a `florist_availability_overrides` table scoped to (user_id, flower_id, region_id, month)
- Override takes precedence over seed data for that florist's view
- Over time, aggregated overrides improve the base dataset

**Phase 3 (future) — Wholesaler paste integration:**
- The `availability_pastes` system already exists
- Enhance it: florist pastes her wholesaler's weekly availability list, we parse and match to flowers
- This gives real-time "what's actually on the truck this week" data

### 3.2 Schema Addition

```sql
-- Florist-level availability overrides (inline correction)
create table if not exists florist_availability_overrides (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  flower_id   uuid        not null references flowers(id) on delete cascade,
  region_id   uuid        not null references regions(id) on delete cascade,
  month       int2        not null check (month between 1 and 12),
  status      text        not null check (status in ('available', 'unavailable')),
  updated_at  timestamptz not null default now(),
  unique (user_id, flower_id, region_id, month)
);

-- Source tagging per flower per supplier
-- (extends existing flower_supplier_prices with a standing relationship)
create table if not exists flower_supplier_defaults (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  flower_id   uuid        not null references flowers(id) on delete cascade,
  supplier_id uuid        not null references suppliers(id) on delete cascade,
  is_preferred boolean    not null default true,
  unique (user_id, flower_id, supplier_id)
);
```

---

## 4. What Gets Cut

| Feature | Current Location | Reason |
|---|---|---|
| Community contribution page | `app/contribute/` | Zero users contributing. Replaced by inline correction in Recipe Builder. |
| AG review admin | `app/admin/ag-review/` | Internal tooling, not needed for v2 launch. |
| Admin vibes page | `app/admin/vibes/` | Vibe classification happens automatically via AI on intake. No manual admin needed. |
| RegionSeasonalityUpload component | `src/components/RegionSeasonalityUpload.tsx` | Replaced by seed data + inline correction. |
| Separate RecipesScreen | `src/components/EventFlow/RecipesScreen.tsx` | Merged into unified Recipe Builder. |
| Separate BuildScreen | `src/components/EventFlow/BuildScreen.tsx` | Merged into unified Recipe Builder. |
| BunchSizesTable component | `src/components/BunchSizesTable.tsx` | Bunch sizes become inline data in the BOM view. |
| ContractScreen | `src/components/EventFlow/ContractScreen.tsx` | Contracts are a v3 feature. Focus on proposals first. |

**What stays untouched:**

- Portal (`app/portal/[slug]/`) — beautiful, functional, keep as-is
- Estimator (`app/estimator/`) — lead magnet, works independently
- Auth flow (login, callback, middleware) — works
- Supabase infrastructure (all 22 migrations remain; we add new ones on top)
- TopNav, Toast, ConfirmModal — utility components
- Supplier management — already well-structured
- Flower cost tracking (flower_supplier_prices) — critical for BOM
- ProposalEditor — differentiated feature, minor tweaks only

---

## 5. Design System Updates

### 5.1 Current State (Good Foundation)

You already have an editorial bridal system with:
- Playfair Display (display serif) + Libre Baskerville (body serif) — beautiful for bride-facing pages
- Earthy color tokens: bone, parchment, charcoal, olive, clay, dusty-rose
- Custom slider and select styles
- Shadow system (paper, lifted)

### 5.2 What to Add

**Dual personality: Bride Portal vs. Florist Dashboard.**

The portal and intake form use the editorial serif system (Playfair + Libre Baskerville) — this is correct and should stay. But the florist's working dashboard (recipe builder, BOM, events list) needs to feel like a *tool*, not a magazine. Add Inter or Source Sans Pro as a sans-serif option for the dashboard:

```css
@theme {
  --font-tool: 'Inter', system-ui, sans-serif;
}
```

Use `font-tool` for the florist dashboard. Use `font-display` and `font-body` for bride-facing pages. Same color palette, different typographic grammar.

**Specific additions:**

- **Sage as primary action color (#7A8C6E → sage-600).** Buttons, active states, progress indicators. Currently charcoal is used for primary buttons — sage is warmer and more on-brand.
- **8px spacing grid.** Standardize all padding/margins to multiples of 8 (8, 16, 24, 32, 40, 48). The current code is inconsistent.
- **44px minimum touch targets.** Your wife works from her phone. Every button and input needs to be tappable.
- **Skeleton loading states.** Replace "Loading…" text with animated skeleton screens using `bg-parchment animate-pulse rounded-lg`.
- **Season badge redesign.** The current SeasonBadge is functional but small. In the Recipe Builder, make season status a prominent visual signal — not just a pill, but a background tint on the entire flower card (subtle green wash for in-season, amber for shoulder, muted/desaturated for out-of-season).
- **Empty states.** Beautiful, encouraging empty states for new users. "No events yet — your first inquiry will appear here" with a subtle floral illustration or icon, not a blank page.

### 5.3 Mobile Priorities

The florist's most common mobile tasks:
1. Check if a new inquiry came in (glance at events list)
2. Quick-reference a recipe during a venue consultation
3. Share a proposal link with a bride

Design the events list and recipe view as mobile-first. The Recipe Builder's three-panel layout collapses to a tabbed interface on mobile (Deliverables tab, Browse tab, Recipe tab).

---

## 6. Updated Event Flow

The stepper simplifies from the current multi-step to four clear stages:

```
  ① Review Intake  →  ② Build Recipes  →  ③ Price & BOM  →  ④ Proposal
```

**Step 1 — Review Intake:** Florist sees the inquiry data, confirms/edits client info and deliverable quantities. One-click to "Start Planning."

**Step 2 — Build Recipes:** The unified Recipe Builder (Section 1.3). This is where most of the time is spent. Each deliverable gets a recipe. Seasonality and pricing context are inline.

**Step 3 — Price & BOM:** Auto-generated from recipes. Florist reviews costs, adjusts margins, assigns suppliers. Export BOM as CSV for ordering. Save quote.

**Step 4 — Proposal:** AI-generated proposal draft. Florist edits, saves, sends via link or downloads as PDF.

---

## 7. Sprint Breakdown

### Week 1 (April 21–27): Pipeline Foundation

- [ ] Merge RecipesScreen + BuildScreen into unified RecipeBuilder component
- [ ] Wire inquiry → event auto-creation (server action)
- [ ] Add guest count + color palette to IntakeForm
- [ ] Update event flow stepper to 4 steps
- [ ] Add `recipe_items` table migration
- [ ] Seed Utah region seasonality data for all 45 flowers
- [ ] Set up your wife's two suppliers in the suppliers table (Ecuador farm, Red Mountain)

### Week 2 (April 28 – May 4): BOM + Hours Saved

- [ ] Refactor PriceScreen to aggregate from recipe_items
- [ ] Add bunch rounding and supplier assignment logic
- [ ] Build BOM CSV export (grouped by supplier)
- [ ] Create `event_timestamps` table and tracking logic
- [ ] Build HoursSavedDashboard component
- [ ] Add `florist_availability_overrides` table + inline correction UI in Recipe Builder
- [ ] Delete cut features (contribute page, AG admin, etc.)

### Week 3 (May 5–11): Polish + Ship

- [ ] Auto-fill proposal client info from event record
- [ ] Photo upload (Supabase Storage) replacing URL paste on intake form
- [ ] Mobile responsive pass on Recipe Builder (three-panel → tabbed)
- [ ] Design system alignment (sage buttons, 8px grid, skeleton loading)
- [ ] Season badge visual redesign (card-level tinting)
- [ ] Deploy to Vercel, connect to production Supabase
- [ ] Run a real wedding through the full pipeline with your wife
- [ ] Fix everything that breaks

---

## 8. Success Criteria

The sprint is done when:

1. A bride can fill out the intake form on the portal and the florist sees a fully populated event within seconds.
2. The florist can build recipes for every deliverable with clear seasonal guidance, in one screen, in under 15 minutes.
3. The BOM generates automatically, grouped by supplier, exportable as CSV.
4. A professional proposal generates via AI and can be sent as a link.
5. The hours-saved dashboard shows cumulative time savings.
6. Your wife has run at least one real wedding through it and says "I can't go back."

---

## Appendix: File Map (Post-Sprint)

```
app/
  page.tsx                        → redirects to /events
  login/page.tsx                  → magic link login
  events/page.tsx                 → event list + hours-saved dashboard
  events/[id]/page.tsx            → event detail (intake review)
  events/[id]/recipes/page.tsx    → unified Recipe Builder
  events/[id]/bom/page.tsx        → Price & BOM
  events/[id]/proposal/page.tsx   → Proposal editor + export
  estimator/page.tsx              → lead magnet (unchanged)
  portal/[slug]/page.tsx          → florist portal (unchanged)
  settings/page.tsx               → florist profile, pricing, suppliers
  auth/callback/route.ts          → Supabase auth (unchanged)

src/
  components/
    RecipeBuilder/
      RecipeBuilder.tsx           → unified three-panel component
      DeliverablePanel.tsx        → left panel (deliverable list)
      FlowerBrowserPanel.tsx      → center panel (filterable flower list)
      RecipeCard.tsx              → right panel (recipe for active deliverable)
    HoursSavedDashboard.tsx       → cumulative savings display
    IntakeForm.tsx                → enhanced intake (guest count, colors, upload)
    EventFlow/
      EventFlowStepper.tsx        → 4-step stepper (keep, reconfigure)
      PriceScreen.tsx             → refactored BOM
      ProposalEditor.tsx          → minor enhancements
      ExportActions.tsx           → BOM CSV export
    FlowerBrowser.tsx             → refactored, reused in RecipeBuilder
    SeasonBadge.tsx               → redesigned with card-level tinting
    (deleted: RecipesScreen, BuildScreen, BunchSizesTable,
     RegionSeasonalityUpload, ContractScreen)
  lib/
    seasonality.ts                → enhanced with region + override logic
    supabase.ts                   → unchanged
    supabase-server.ts            → unchanged
    pricing/                      → unchanged
    save-inquiry-action.ts        → enhanced with auto-event creation
    hours-saved.ts                → new: savings calculation logic

supabase/
  migrations/
    023_recipe_items.sql          → recipe_items table
    024_event_timestamps.sql      → pipeline step tracking
    025_availability_overrides.sql → inline correction table
    026_flower_supplier_defaults.sql → preferred supplier mapping
    027_utah_seasonality_seed.sql → seed data for 45 flowers
  seed.sql                        → unchanged (base flower data)
```
