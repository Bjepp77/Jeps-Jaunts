# Fauna v2 — Claude Code Task Prompts

Run these **in order**. Each task is self-contained. Copy-paste the prompt block into Claude Code. Review the output before moving to the next task.

**Before starting:** Make sure Claude Code has read `ARCHITECTURE-V2.md` and `docs/FAUNA_QUICK_START.md` in this repo.

---

## Week 1: Pipeline Foundation

---

### Task 1.1 — Migration: recipe_items table

```
Read ARCHITECTURE-V2.md Section 1.3 (Recipe Builder) for context.

Create a new Supabase migration file at supabase/migrations/023_recipe_items.sql.

The recipe_items table stores which flowers go into each deliverable recipe for an event:

- id: uuid, PK, default gen_random_uuid()
- event_id: uuid, NOT NULL, FK → events(id) ON DELETE CASCADE
- deliverable_type: text, NOT NULL (e.g., 'bridal_bouquet', 'bridesmaid_bouquet', 'centerpiece', etc.)
- flower_id: uuid, NOT NULL, FK → flowers(id) ON DELETE CASCADE
- stems_per_unit: integer, NOT NULL, default 1 (stems of this flower per single arrangement)
- created_at: timestamptz, NOT NULL, default now()
- updated_at: timestamptz, NOT NULL, default now()
- UNIQUE constraint on (event_id, deliverable_type, flower_id)

Add indexes on event_id and flower_id.

Enable RLS. Add policies:
- Users can SELECT/INSERT/UPDATE/DELETE their own recipe_items (join through events.user_id = auth.uid())

Follow the pattern of existing migrations in supabase/migrations/ for style and conventions.
```

**Verify:** Open the migration file. Check the RLS policies join through events correctly. Check the unique constraint.

---

### Task 1.2 — Migration: event_timestamps table

```
Read ARCHITECTURE-V2.md Section 2 (Hours Saved Dashboard) for context.

Create supabase/migrations/024_event_timestamps.sql.

The event_timestamps table tracks when a florist reaches each pipeline step, used to calculate hours saved:

- id: uuid, PK, default gen_random_uuid()
- event_id: uuid, NOT NULL, FK → events(id) ON DELETE CASCADE
- step: text, NOT NULL, CHECK (step IN ('intake_received', 'recipes_started', 'recipes_finalized', 'bom_generated', 'proposal_sent'))
- occurred_at: timestamptz, NOT NULL, default now()
- UNIQUE constraint on (event_id, step) — each step recorded once per event

Enable RLS. Users can read/write their own timestamps (join through events.user_id = auth.uid()).
```

**Verify:** Check the step enum values match the architecture plan. Confirm unique constraint prevents duplicate step entries.

---

### Task 1.3 — Migration: availability overrides + supplier defaults

```
Read ARCHITECTURE-V2.md Section 3 (Seasonality Infrastructure) for context.

Create supabase/migrations/025_availability_overrides.sql with two tables:

1. florist_availability_overrides:
   - id: uuid PK
   - user_id: uuid NOT NULL FK → auth.users(id) ON DELETE CASCADE
   - flower_id: uuid NOT NULL FK → flowers(id) ON DELETE CASCADE
   - region_id: uuid NOT NULL FK → regions(id) ON DELETE CASCADE
   - month: int2 NOT NULL CHECK (month BETWEEN 1 AND 12)
   - status: text NOT NULL CHECK (status IN ('available', 'unavailable'))
   - updated_at: timestamptz NOT NULL DEFAULT now()
   - UNIQUE (user_id, flower_id, region_id, month)

2. flower_supplier_defaults:
   - id: uuid PK
   - user_id: uuid NOT NULL FK → auth.users(id) ON DELETE CASCADE
   - flower_id: uuid NOT NULL FK → flowers(id) ON DELETE CASCADE
   - supplier_id: uuid NOT NULL FK → suppliers(id) ON DELETE CASCADE
   - is_preferred: boolean NOT NULL DEFAULT true
   - UNIQUE (user_id, flower_id, supplier_id)

Enable RLS on both. Users manage their own rows (auth.uid() = user_id).
```

**Verify:** Both tables created. RLS enabled. Foreign keys correct.

---

### Task 1.4 — Wire inquiry → event auto-creation

```
Read ARCHITECTURE-V2.md Section 1.2 (Inquiry → Event Bridge) and the existing file src/lib/save-inquiry-action.ts.

Modify save-inquiry-action.ts so that after successfully saving a client_inquiry, it also:

1. Creates a new event record with:
   - name: "{client_name} Wedding" (or "{client_name} Event" if event_type != 'wedding')
   - event_date: from inquiry
   - user_id: the florist_id from the inquiry
   - inquiry_id: the newly created inquiry's id
   - lead_status: 'new'
   - client_name, client_email, client_phone, venue, budget_cents: copied from inquiry
   - vibe_tags_json: copied from inquiry

2. Parses deliverables_json from the inquiry and creates corresponding records. The deliverables_json has the shape: [{ "key": "bridal_bouquet", "quantity": 1 }, { "key": "centerpiece", "quantity": 19 }, ...]. Store these as event-level deliverable quantities — check how the existing event flow handles deliverable quantities (look at the BuildScreen and its saveDeliverableAction) and match that pattern.

3. Records an event_timestamp with step = 'intake_received'.

Also add an event_timestamp for 'intake_received' in the same transaction.

Keep the existing inquiry save logic intact. The event creation is additive.
```

**Verify:** Submit a test inquiry via the portal intake form. Check Supabase: both a client_inquiry AND an event should be created, linked by inquiry_id. Event should have client info populated and deliverable quantities set.

---

### Task 1.5 — Enhance IntakeForm (guest count, color palette, smart defaults)

```
Read ARCHITECTURE-V2.md Section 1.1 (Client Intake Form).

Edit src/components/IntakeForm.tsx to add:

1. Guest count field — add between venue and budget fields. Input type number, min 10, max 500, placeholder "150". Name: "guest_count".

2. Color palette selector — add after budget, before deliverables. Render as a set of selectable chip/pill buttons (not a dropdown). Options:
   - blush_ivory: "Blush & Ivory"
   - jewel_tones: "Jewel Tones"
   - earth_tones: "Earth Tones"
   - all_white: "All White"
   - pastels: "Pastels"
   - bold_bright: "Bold & Bright"
   - moody_dark: "Moody & Dark"
   - custom: "Custom" (shows a text input when selected)
   Allow selecting one. Name: "color_palette". If "custom" is selected, also capture "color_palette_custom" text input.

3. Smart deliverable defaults — when guest_count changes AND event_type is "wedding", auto-suggest:
   - centerpieces: ceil(guest_count / 8)
   - bridal_bouquet: 1
   - bridesmaid_bouquet: 4
   - boutonniere: 6
   - corsage: 4
   Pre-fill the quantity inputs but let the bride override. Only auto-fill if the field is currently 0 or empty.

4. Update the form styling to match the existing editorial bridal system (bone backgrounds, charcoal text, olive accents, Libre Baskerville body font). Reference the existing IntakeForm styles — they're already close, just ensure consistency.

Update the save-inquiry-action to persist guest_count and color_palette to the client_inquiries table. You may need to add these columns — create supabase/migrations/026_inquiry_enhance.sql to add:
  - guest_count integer to client_inquiries
  - color_palette text to client_inquiries
  - color_palette_custom text to client_inquiries
  - guest_count integer to events (also copy from inquiry in the auto-creation logic from Task 1.4)
```

**Verify:** Load the portal intake form. Guest count should appear. Color palette chips should be selectable. Entering a guest count of 150 for a wedding should auto-populate 19 centerpieces, 1 bridal, 4 bridesmaids, 6 boutonnieres, 4 corsages.

---

### Task 1.6 — Update event flow stepper to 4 steps

```
Read ARCHITECTURE-V2.md Section 6 (Updated Event Flow).

Edit the event flow to use 4 steps instead of the current configuration:

1. Review Intake — shows inquiry data, client info, deliverable quantities (editable)
2. Build Recipes — the unified Recipe Builder (we'll build this component in Task 1.7)
3. Price & BOM — existing PriceScreen (will refactor in Week 2)
4. Proposal — existing ProposalEditor

Update the EventFlowStepper configuration in the event detail page (app/events/[id]/ routes).

The route structure should be:
- /events/[id] → Review Intake (event detail, client info, deliverables)
- /events/[id]/recipes → Build Recipes (placeholder for now: "Recipe Builder coming soon")
- /events/[id]/bom → Price & BOM (existing PriceScreen, keep working)
- /events/[id]/proposal → Proposal (existing ProposalEditor, keep working)

Update the stepper labels: "Review", "Recipes", "Price & BOM", "Proposal"

For now, the recipes route can render a placeholder. We'll build the real component next.
```

**Verify:** Navigate to an event. Stepper shows 4 steps. Each route loads. Existing Price and Proposal screens still work.

---

### Task 1.7 — Build the unified Recipe Builder (scaffold)

```
Read ARCHITECTURE-V2.md Section 1.3 (Recipe Builder) carefully — it describes a three-panel layout.

Create the following new component files:

1. src/components/RecipeBuilder/RecipeBuilder.tsx — the main component. Three-panel layout:
   - Left: DeliverablePanel
   - Center: FlowerBrowserPanel
   - Right: RecipeCard
   State management: track activeDeliverable (which deliverable type is selected), recipes (Map of deliverable_type → array of { flower_id, stems_per_unit }), and running totals.

2. src/components/RecipeBuilder/DeliverablePanel.tsx — left panel.
   Props: deliverables (array of { type, label, quantity }), activeType, onSelect.
   Renders a list of deliverable types with quantities. Clicking one sets it as active. Shows running totals at the bottom (total focal, filler, greens, accent stems across all recipes × quantities).

3. src/components/RecipeBuilder/FlowerBrowserPanel.tsx — center panel.
   Refactor from the existing FlowerBrowser.tsx component. Keep the search, category filter, and season badge. Add:
   - Color tag filter
   - Season status filter (in season / shoulder / out of season)
   - Each flower card shows: name, category, season badge, supplier source (if known), last price per stem (if known)
   - "[+ Add]" button that adds the flower to the active recipe

4. src/components/RecipeBuilder/RecipeCard.tsx — right panel.
   Shows the recipe for the currently active deliverable. Lists each flower with a stems_per_unit number input. Shows per-unit total and grand total (× quantity). "Save Draft" button (calls a server action to persist to recipe_items table). "Next →" button to advance to the next deliverable or to the BOM step.

Wire the RecipeBuilder into app/events/[id]/recipes/page.tsx as a server component that:
- Fetches the event (with deliverable quantities)
- Fetches all flowers (with season data for the event month and region)
- Fetches existing recipe_items for this event
- Passes data to the client RecipeBuilder component

Create server actions:
- src/lib/recipe-actions.ts: saveRecipeItems(eventId, deliverableType, items[]) and finalizeRecipes(eventId)

Style using the existing editorial system: bone backgrounds, charcoal text, hairline borders, section cards with shadow-paper. Reference the existing BuildScreen and RecipesScreen for styling patterns — keep it consistent.

On mobile (below lg breakpoint), collapse the three panels into a tabbed interface with three tabs: Deliverables, Browse, Recipe.

IMPORTANT: Do NOT delete the existing RecipesScreen.tsx or BuildScreen.tsx yet. We'll remove them after confirming the new RecipeBuilder works.
```

**Verify:** Navigate to /events/[id]/recipes. Three panels render. You can select a deliverable, browse flowers, add flowers to a recipe, adjust stem counts, and save. Data persists to recipe_items table. Mobile view shows tabs instead of panels.

---

## Week 2: BOM + Hours Saved

---

### Task 2.1 — Refactor PriceScreen to aggregate from recipe_items

```
Read ARCHITECTURE-V2.md Section 1.4 (Price & BOM).

Refactor the PriceScreen (src/components/EventFlow/PriceScreen.tsx) and its parent page to:

1. Pull line items from recipe_items instead of the cart. For each flower in recipe_items:
   - total_stems = SUM(stems_per_unit × deliverable_quantity) across all deliverables using that flower
   - Group by flower_id

2. Add bunch rounding: for each line, show stems_needed AND bunches_needed (ceil(stems / stems_per_bunch)). Pull stems_per_bunch from the flower record or default to 10 if not set.

3. Auto-assign suppliers: for each flower, check flower_supplier_defaults for a preferred supplier. If found, pre-select it. If not, check flower_supplier_prices for the most recent price entry and use that supplier.

4. Add "Wholesale View" toggle. Currently the screen is a hybrid. Split into two views:
   - "Client View": shows retail prices, margin-applied, suitable for proposals
   - "Wholesale View": groups by supplier, shows cost prices, stems, bunches — this is the BOM for ordering

5. Add CSV export button for the Wholesale View. Output: Supplier, Flower, Stems Needed, Bunches, Stems/Bunch, Cost/Stem, Line Total. One section per supplier. Use the existing ExportActions pattern or create a new exportBOM utility.

Record event_timestamp 'bom_generated' when the quote is saved.

Keep the existing quote-saving functionality intact. Just change where the data comes from (recipe_items instead of cart) and add the bunch rounding + CSV export.
```

**Verify:** Open an event with saved recipes. PriceScreen shows aggregated line items from recipes. Bunch counts display. CSV downloads correctly grouped by supplier. Client/Wholesale toggle works.

---

### Task 2.2 — Build HoursSavedDashboard component

```
Read ARCHITECTURE-V2.md Section 2 (Hours Saved Dashboard).

Create src/components/HoursSavedDashboard.tsx and src/lib/hours-saved.ts.

hours-saved.ts — pure calculation logic:
- BENCHMARK_MINUTES constant: { intake_review: 20, seasonality_research: 75, recipe_building: 30, price_calculation: 28, bom_assembly: 19, proposal_writing: 30 }
- Total benchmark per event: 202 minutes (3.37 hours)
- calculateSavings(events: EventWithTimestamps[]) → { totalHoursSaved, eventsCompleted, avgPerEvent, monthlyBreakdown[], reductionPercent }
- For each completed event (has at least 'bom_generated' or 'proposal_sent'), credit the full benchmark savings. (We're measuring "hours you would have spent manually" not "actual time in the app".)

HoursSavedDashboard.tsx — display component:
- Big number: "{X} hours saved" in font-display italic, large size
- Subtitle: "across {N} events"
- Progress bar showing reduction percentage (use olive/sage fill)
- Monthly breakdown: simple list "This month: X hrs (N events)" etc.
- Style: bg-section border border-hairline rounded-xl shadow-paper, matching the existing editorial system
- Should feel like a dashboard KPI card — prominent but not overwhelming

Wire this into app/events/page.tsx (the events list page) — render the dashboard at the top, above the event list.

Fetch event_timestamps in the events page server component and pass the calculated data to HoursSavedDashboard.
```

**Verify:** Events page shows the hours-saved dashboard at the top. Numbers calculate correctly based on events with timestamps. Styling matches the editorial system.

---

### Task 2.3 — Inline availability correction in Recipe Builder

```
Read ARCHITECTURE-V2.md Section 3.1 Phase 2 (Inline correction).

In the FlowerBrowserPanel (src/components/RecipeBuilder/FlowerBrowserPanel.tsx), add a small "Flag" action to each flower card.

When clicked, show a small popover or inline toggle:
- "Available in my area" → writes status='available' to florist_availability_overrides for (user_id, flower_id, region_id, current_event_month)
- "Not available" → writes status='unavailable'

If the florist has an override for a flower+month, it should take precedence over the base seasonality data when computing the season badge.

Update the seasonality logic in src/lib/seasonality.ts:
- New function: getEffectiveSeasonStatus(flower, eventMonth, regionSeasonality, overrides)
- Check overrides first (scoped to user + region + month)
- Fall back to region_flower_seasonality
- Fall back to base flower.in_season_months / shoulder_months

Create a server action: src/lib/availability-override-action.ts that saves/updates the override.

Keep the flag action subtle — a small icon or text link, not a prominent button. The florist shouldn't feel like she has to flag every flower. It's there for corrections, not as a primary workflow.
```

**Verify:** In the Recipe Builder, flag a flower as "Not available". Its season badge should change. Reload — the override persists. Flag it back to "Available" — badge updates. Check florist_availability_overrides table in Supabase.

---

### Task 2.4 — Delete cut features

```
Read ARCHITECTURE-V2.md Section 4 (What Gets Cut).

Remove the following:

1. Delete app/contribute/ directory entirely (community contribution page)
2. Delete app/admin/ag-review/ directory
3. Delete app/admin/vibes/ directory
4. Delete src/components/RegionSeasonalityUpload.tsx
5. Delete src/components/BunchSizesTable.tsx

Check for any imports of these deleted files and remove those import statements. Check the TopNav or any navigation components for links to /contribute or /admin routes and remove them.

Do NOT delete:
- RecipesScreen.tsx or BuildScreen.tsx yet (we'll confirm the Recipe Builder works first and clean these up in Week 3)
- ContractScreen.tsx (keep the file but remove it from the flow stepper — it's not in the 4-step flow)

Run the build (npm run build) to ensure no broken imports.
```

**Verify:** npm run build succeeds with no errors. Navigating to /contribute, /admin/ag-review, /admin/vibes returns 404. No dead links in navigation.

---

## Week 3: Polish + Ship

---

### Task 3.1 — Proposal auto-fill + enhancements

```
Read ARCHITECTURE-V2.md Section 1.5 (Proposal Generator).

In the ProposalEditor (src/components/EventFlow/ProposalEditor.tsx) and its parent page:

1. Auto-fill client info fields from the event record. The event already has client_name, client_email, venue, event_date. The florist profile has business_name. Pre-populate these in the ProposalEditor's client info section instead of requiring manual entry.

2. Record event_timestamp 'proposal_sent' when the proposal is saved/exported.

That's it for now. PDF export and shareable proposal links are v2.1 features — don't build them in this sprint.
```

**Verify:** Open an event's proposal step. Client info fields should be pre-filled from the event data. Saving a proposal should create an event_timestamp.

---

### Task 3.2 — Photo upload on intake form

```
The intake form currently uses URL paste inputs for inspiration photos. Replace with file upload to Supabase Storage.

In src/components/IntakeForm.tsx:

1. Replace the three URL text inputs with a drag-and-drop file upload zone. Accept image files (jpg, png, webp, heic). Max 3 files, max 5MB each.

2. On form submit, upload files to Supabase Storage bucket "inquiry-photos" with path: {inquiry_id}/{filename}. Use the Supabase Storage JS client.

3. After upload, save the storage paths to the inquiry_photos table (which already exists from migration 015).

4. Style the upload zone to match the editorial system: dashed border (border-hairline), bone background, "Drop photos here or click to browse" text in brown-muted, small text below "PNG, JPG, WebP · Max 3 photos · 5MB each".

Make sure the Supabase Storage bucket "inquiry-photos" exists. If it doesn't, create a migration or document that it needs to be created in the Supabase dashboard with public read access (so the florist can view uploaded photos).

Note: The existing inquiry_photos table has a storage_path column. Use that to store the path. The haiku_vibe_tags_json classification can remain — the existing /api/classify-inquiry-photos endpoint should still work if it's triggered after upload.
```

**Verify:** Open the portal intake form. Drag and drop a photo. Submit. Check Supabase Storage — photo should be in inquiry-photos bucket. Check inquiry_photos table — row should exist with storage_path.

---

### Task 3.3 — Mobile responsive pass on Recipe Builder

```
The Recipe Builder (src/components/RecipeBuilder/RecipeBuilder.tsx) uses a three-panel layout that works on desktop. Make it work on mobile.

Below the lg breakpoint (1024px):
- Collapse the three panels into a tabbed interface
- Three tabs: "Deliverables", "Browse", "Recipe"
- Tabs should be sticky at the top of the content area
- Active tab highlighted with olive/sage underline
- Tapping a deliverable in the Deliverables tab should switch to the Recipe tab for that deliverable
- Adding a flower in Browse tab should show a brief toast confirmation ("Added Garden Rose to Bridal Bouquet") instead of requiring the user to switch to the Recipe tab

Touch targets: ensure all buttons and inputs are at least 44px tall. Check the +/- quantity buttons, the "[+ Add]" buttons, and the stem count inputs.

Test at 375px width (iPhone SE) and 390px width (iPhone 14).
```

**Verify:** Resize browser to mobile width. Tabs appear. Can complete full workflow: select deliverable → browse flowers → add to recipe → adjust stems → save. All targets are easily tappable.

---

### Task 3.4 — Design system alignment pass

```
Read docs/FAUNA_QUICK_START.md for the design token reference.

Make a styling consistency pass across the app:

1. Primary action buttons: Change from bg-charcoal to bg-olive (the sage/olive green #5E6B5B) for primary actions across the florist dashboard. Keep charcoal for the bride-facing portal. Files to update: any component with "bg-charcoal" used as a primary action button in the florist interface (EventFlowStepper, RecipeBuilder, PriceScreen, ProposalEditor, events list page).

2. 8px spacing grid: Audit padding and margins. Replace any odd values (py-2.5, px-5, gap-3, mb-5) with 8px multiples where possible (py-2 or py-3 = 8 or 12px, px-4 or px-6, gap-2 or gap-4, mb-4 or mb-6). Don't break layouts — only adjust where the visual difference is negligible.

3. Skeleton loading: In the events list page and the Recipe Builder, replace "Loading…" text with skeleton loading states: div elements with "bg-parchment animate-pulse rounded-lg" and appropriate heights matching the content they replace.

4. Empty states: For the events list (when no events exist), replace any blank/minimal empty state with a centered card: a subtle floral icon (use a simple SVG or the ✿ character), heading "No events yet" in font-display italic, subtext "When a client submits an inquiry, it will appear here" in font-body italic text-brown-muted.

5. Season badge redesign: In FlowerBrowserPanel, instead of just a small pill badge, add a subtle background tint to the entire flower card:
   - In season: very subtle green wash (bg-olive/5 or similar)
   - Shoulder: very subtle amber wash (bg-clay/5)
   - Out of season: slightly desaturated/muted card (opacity-75 or bg-bone with muted text)
   Keep the text badge too, but the card-level tint makes seasonality scannable at a glance.

Don't touch the portal or estimator styling — those already look good with the editorial system.
```

**Verify:** Visual review of events list, Recipe Builder, and PriceScreen. Buttons are olive/sage green. Loading states use skeletons. Empty state looks beautiful. Flower cards have subtle season tinting.

---

### Task 3.5 — Clean up deprecated components

```
Now that the Recipe Builder is working, clean up the old components:

1. Delete src/components/EventFlow/RecipesScreen.tsx
2. Delete src/components/EventFlow/BuildScreen.tsx
3. Delete src/components/EventFlow/ContractScreen.tsx
4. Remove any route files that referenced these (e.g., app/events/[id]/flow/build/, app/events/[id]/flow/setup/, app/events/[id]/flow/contract/)
5. Remove imports of these components anywhere they're referenced
6. Remove server actions that only served the old BuildScreen (like applyToCartAction, saveEventRecipes, finalizeEventRecipes) IF they are no longer called by any component. Check first.

Run npm run build to confirm no broken imports.
Run npm test to confirm no broken tests.
Fix any failures.
```

**Verify:** npm run build passes. npm test passes. No references to deleted files remain in the codebase. The old flow routes return 404.

---

### Task 3.6 — Deploy and end-to-end test

```
This is NOT a coding task. This is a deployment and testing checklist.

1. Ensure .env.local has correct Supabase project URL and anon key
2. Run all new migrations (023 through 026+) against the production Supabase project
3. Verify the "inquiry-photos" storage bucket exists in Supabase
4. Deploy to Vercel: push to main branch or run vercel deploy
5. Test the full pipeline end-to-end:
   a. Visit the portal (/portal/[slug]) and submit an intake form as a test bride
   b. Log in as the florist — verify the event auto-created with deliverables
   c. Open the event — step through Review → Recipes → Price & BOM → Proposal
   d. Build recipes with at least 3 different flowers across 2 deliverable types
   e. Verify season badges are correct for the event month
   f. Save the BOM, export CSV
   g. Generate and save a proposal
   h. Check the hours-saved dashboard on the events page — should show savings
6. Test on mobile (use phone or Chrome DevTools device emulation)

Document any bugs found. Fix them. Re-test.
```

---

## Seasonality Research (Separate Track)

This is NOT a Claude Code task. Do this with me (Claude in Cowork) separately.

```
We need to seed the region_flower_seasonality table for Utah/Mountain West region
for all 45 flowers in the seed data. This requires real wholesale availability
research from Mayesh, DVFlora, FiftyFlowers, and local Utah grower knowledge.

We'll produce: supabase/migrations/027_utah_seasonality_seed.sql

Do this as a research session, not a coding session.
```

---

## Sequence Summary

```
Week 1 (Pipeline Foundation):
  1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7
  (1.1-1.3 can run in parallel since they're independent migrations)

Week 2 (BOM + Hours Saved):
  2.1 → 2.2 → 2.3 → 2.4
  (2.2 can run in parallel with 2.1)

Week 3 (Polish + Ship):
  3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
  (3.1 and 3.2 can run in parallel)
  (3.3 and 3.4 can run in parallel)

Seasonality Research: Do anytime during Week 1 or 2.
Run migration 027 before Task 3.6 (deploy).
```
