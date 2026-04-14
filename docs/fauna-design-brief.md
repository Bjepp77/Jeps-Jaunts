# FAUNA Design Brief
## Premium SaaS for Florist Event Planning

**Status:** Research-backed design intelligence for florist-facing and bride-facing UX
**Date:** April 2026
**Audience:** Florists (primary) + Brides/Couples (intake + portal)

---

## Executive Summary

Fauna occupies a unique space: a professional SaaS for florists (who demand efficiency and control) paired with a beautiful bride-facing portal (who expects editorial elegance). The design must simultaneously feel:
- **Confident, tool-like, and information-rich** for florists managing proposals, budgets, and teams in the field
- **Elevated, editorial, and emotionally resonant** for brides experiencing Fauna as a curated planning partner

This brief synthesizes patterns from leading florist SaaS (Curate, HoneyBook, Aisle Planner), luxury editorial design (Kinfolk, The Lane), and modern SaaS dashboards (Figma, Notion, Linear) to create actionable design guardrails.

---

## Part 1: Leading Florist/Wedding SaaS Design Patterns

### What the Best Florist Tools Do Right

#### 1. **Curate (Florist Proposals)**
**What Works:**
- Drag-and-drop proposal builder with direct inline editing
- "See what clients see" live preview (florist view vs. client view separation is critical)
- Auto-save + undo workflow (no "save" button anxiety)
- Single-screen proposal creation (stem count + pricing visible to florist, hidden from client)
- Responsive proposals (mobile-optimized for bride preview)
- Media management: Pinterest integration + cropping + color scheme override

**Design Pattern:** Single unified canvas with distinct info density for creator vs. viewer. The working canvas is complex; the delivered artifact is clean.

**Mobile Consideration:** Florists pull references from Pinterest while building; the tool must work with split-screen workflows on tablet/phone.

#### 2. **HoneyBook (Wedding SaaS + CRM)**
**What Works:**
- Dashboard snapshot on entry: leads, tasks, calendar, revenue summary (one screen, not five)
- Clear project status visibility without drilling down
- Smart Files: interactive, branded client experiences (review → sign → pay in one flow)
- Configurable workflow automation (triggers + actions)
- Integrated email, payments, contracts in one platform

**Design Pattern:** Dashboard as trust-builder—client financial health and project progress visible at a glance. Reduces cognitive load.

**Client Portal Pattern:** Clients complete questionnaires, sign documents, and pay without leaving the portal. Each interaction is a moment of delight.

#### 3. **Aisle Planner (All-in-One Floral SaaS)**
**What Works:**
- Mood boards + style guides + color palette collaboration
- Role-based access (admin, manager, designer sees only their domain)
- Proposal + payment + scheduling + communication linked seamlessly
- Visual assets (images) centered in the workflow, not buried

**Design Pattern:** Visual-first collaboration. Florists and brides work in shared mood boards before proposal finalization.

#### 4. **Stemcounter (Rebranded as Curate)**
**What Works:**
- Single-screen proposal creation with visible stem count (accuracy + pricing)
- 42% faster initial proposal creation (workflow optimization is measurable)
- Quick duplicate + customize workflow for similar events

**Design Pattern:** Speed through constraint. One screen, visible tooling, fast iteration.

---

## Part 2: Luxury Editorial & Wedding Design Aesthetic

### Kinfolk Magazine (Editorial Benchmark)
**Typographic Approach:**
- Custom serif + sans-serif family (Schick Toikka typefaces) with matched vertical dimensions
- Serif: Display style (higher contrast, heavier weight) for headlines
- Serif: Text style (lower contrast, body-optimized) for long reading
- Sans-serif counterpart for UI labels, dates, metadata
- Both fonts share proportions → can be mixed harmoniously on same page

**Layout:**
- 12-column grid (provides flexibility without chaos)
- Generous whitespace—"breathable" layouts succeed commercially
- Variation in type treatments creates editorial pace
- Typographic detail signals sophistication (not just size changes—tracking, weight, scale relationships matter)

**Application to Fauna:**
- Pair a transitional serif (e.g., **Crimson Pro**, **Cardo**, or **EB Garamond**) with a humanist sans (e.g., **Inter**, **Source Sans Pro**)
- Use serif for proposal headlines, couple names, event details in client views
- Use sans for florist dashboard labels, dates, metrics
- Reserve serif for moments of beauty (couple name on proposal, florist's signature)

### The Lane (Wedding Editorial)
**Visual Aesthetic:**
- Textural, layered composition
- Sophisticated, poetic language in captions
- Cinematic photography with editorial precision
- Craft and storytelling woven into visual settings
- Romantic yet contemporary (not trendy)

**Design Implication for Fauna:**
- Bride portal should feel like opening a design magazine, not a software dashboard
- Mood board section: high-quality image display with generous spacing
- Event timeline: poetic captions + beautiful date treatment
- Color palette view: swatches with room to breathe, not cramped grids

### Martha Stewart Weddings (Curated Detail Richness)
**Approach:**
- Detail-rich styling with custom elements
- Meaningful traditions elevated
- Refined design with personality
- Complex but intentional

**Implication for Fauna:**
- Bride portal: ability to add notes, attach inspiration, track personal touches
- Florist view: can see why the bride loves certain flowers (her notes + inspiration)
- Shared language: florist understands bride's "romantic yet contemporary" aesthetic through her mood board

---

## Part 3: Modern SaaS Dashboard Design for Creative Professionals

### Key Patterns from Figma, Canva, Notion, Linear

#### Information Architecture
**Visual Hierarchy for Florist Dashboard:**
- **Top row:** 3–5 primary KPIs (upcoming events, revenue this month, open proposals, pending approvals)
- **Left sidebar:** Secondary navigation (Proposals, Clients, Inventory, Team, Settings)
- **Main canvas:** Current context (e.g., single proposal view with all controls visible)
- **Right sidebar:** Contextual panel (proposal details, client notes, team assignments)

**Information Density Rule:**
- Aim for 40% density for fast pattern recognition (research shows 63% faster recognition than dense layouts)
- Show enough context without overwhelming (5–7 primary metrics per screen maximum)
- "Dashboard snapshot" approach: overview first, drill-down optional

#### Design System Standards for Florist Tool
**Figma / Modern SaaS Patterns:**
- Component library with variants (button states: default, hover, active, disabled)
- 8-point spacing grid (8px, 16px, 24px, 32px, 40px, 48px, 56px...)
- 4-point baseline grid for typography (line-height = multiple of 4)
- Auto-layout support for responsive component scaling
- Color tokens (primary action, secondary, neutral, alert, success)
- Shadow system (subtle elevation, not dramatic)

#### Micro-Interactions & Premium Feel
Research shows luxury SaaS feels expensive through **restraint**, not spectacle:
- Hover states: controlled, confident (not flashy)
- Loading states: animated shimmer or soft skeleton screens (tells user "we're preparing")
- Animations: 100–300ms (anything slower feels sluggish, faster feels sudden)
- Feedback: haptic-like response (on mobile, subtle bounce or color shift on desktop)
- Empty states: beautiful, encouraging (not error messaging)

**Example for Fauna:**
- Proposal created: soft green success indicator with fade-out (not a modal)
- Client viewed proposal: notification with timestamp + preview thumbnail
- Form validation: inline, green checkmark on field completion (not after submit)

---

## Part 4: Color & Typography Strategy for Fauna

### Your Existing Palette (Earthy, Sophisticated)
```
Sand:       #E8E0D0 (background, breathing room)
Sage:       #7A8C6E (accent, secondary, trust)
Clay:       #B8926A (tertiary, warmth, approachability)
Warm Gray:  #8C8C7A (UI text, subtle elements)
Charcoal:   (text, primary hierarchy—infer darker value for readability)
Bone:       (backgrounds, off-white alternative to white)
```

### Why These Work for Florist SaaS
- **Low saturation:** Reduces fatigue for all-day use in florist shops
- **Warm undertones:** Feels welcoming, not clinical (unlike cool grays)
- **Neutral hierarchy:** Sage reads as trust/authority; clay reads as approachable
- **Photography-friendly:** Won't compete with floral imagery
- **Trendy without dating:** Earthy tones are durable (not pastels that feel dated in 2 years)

### Typography: Recommended Pairings

#### Option A: **Editorial + Professional** (Best for Fauna's split personality)
```
Display (Bride Portal Headlines):
  Crimson Pro Bold
  or Cardo (serif, elegant, romantic)

Body Copy (Bride Portal + Long-form):
  Source Sans Pro Regular (humanist sans, readable at small sizes)
  or Nunito (friendly, modern)

UI Labels & Florist Dashboard:
  Inter (geometric sans, professional, excellent for small text)
  or Source Sans Pro (same as body, creates cohesion)

Monospace (for stem counts, pricing):
  IBM Plex Mono (warm-toned monospace, not stark)
  or JetBrains Mono
```

#### Option B: **Luxury Minimalist** (if you want ultra-sophisticated)
```
Display:
  EB Garamond (classical serif, high-contrast, "quietly expensive")

Body:
  Inter or Lato (clean sans, excellent legibility)
```

### Spacing & Scale System (8pt Grid)

**Margin/Padding increments:**
- 4px (tight, rare—only for micro spacing)
- 8px (form fields, small gaps)
- 16px (component padding)
- 24px (section spacing)
- 32px (major section gaps)
- 40px, 48px, 56px (large layouts)

**Typography Scale:**
```
Florist Dashboard:
  H1 (Dashboard Title):    32px / 40px line-height / 700 weight (sans)
  H2 (Section Headers):    24px / 32px line-height / 600 weight (sans)
  Body:                    16px / 24px line-height / 400 weight (sans)
  Small (labels, captions):12px / 16px line-height / 500 weight (sans)

Bride Portal (Editorial):
  H1 (Event Name):         48px / 56px line-height / 700 weight (serif)
  H2 (Section):            28px / 36px line-height / 600 weight (serif)
  Body:                    18px / 28px line-height / 400 weight (sans)
  Caption (dates, notes):  14px / 20px line-height / 400 weight (sans)
```

**Key Principle:** Serif headlines in bride portal create editorial feel; sans in florist dashboard maintains clarity and speed.

---

## Part 5: Mobile-First Patterns for Florist Field Work

### Critical Context: Florists Use Mobile Everywhere
- Walk-in cooler (referencing color, texture, availability)
- Venue consultations (showing proposals to clients on phone)
- Event setup (checking timeline, confirming deliverables)
- Order fulfillment (updating status from floor)

### Mobile Patterns That Matter

#### 1. **Large, Tappable Targets**
- Buttons: minimum 44px height (not 32px)
- Spacing around buttons: 16px minimum to prevent mis-taps
- Swipe gestures for status updates (swipe left to mark "delivered")

#### 2. **Single-Column Priority**
- Don't try to fit desktop complexity into mobile
- One primary action per screen (e.g., "Create Proposal" button at top)
- Secondary options below (stack vertically)

#### 3. **Context-Preserving Navigation**
- Bottom tab bar (5 tabs max: Dashboard, Proposals, Clients, Inventory, More)
- Tap to go deeper, swipe back to return (preserves scroll position)
- Persist scroll position when switching tabs and returning

#### 4. **Florist-Specific Patterns**
- **Quick status update:** Swipe or tap to mark proposal "viewed by client"
- **Photo capture:** In-app camera for inventory/event photos
- **Quick note:** Voice-to-text or text field for client notes (one tap)
- **Offline access:** Key proposals synced locally (cooler has no signal)

#### 5. **Bride-Facing Mobile Portal**
- Lightweight, image-heavy (not data-heavy)
- Mood board: swipeable card interface (like Instagram Stories)
- Timeline: vertical scroll with dates + checkpoints
- Budget: simple bar chart (not complex nested data)
- Proposal: view-only, beautiful rendering (no editing)

#### 6. **Responsive Image Handling**
Research shows florist software relies heavily on visual assets:
- High-quality image loading with placeholder (skeleton)
- Crop/zoom controls for Pinterest imports (mobile-friendly)
- Color picker overlay on images (detect palette)
- Pinterest integration: direct import without leaving app

---

## Part 6: Florist vs. Bride Experience (Dual-Persona Design)

### Florist Dashboard (Curate/Proposal-Forward)
**Design Philosophy:** Information-dense, tool-like, control-focused

**Key Screens:**

#### 1. Dashboard (Home)
**Top KPIs (40% of viewport):**
```
[Upcoming Events This Month] [Revenue YTD]
[Open Proposals]            [Pending Client Approvals]
```

**Main Canvas (60% of viewport):**
- List of proposals with status indicator (draft / sent / approved / invoiced / delivered)
- Each proposal row: thumbnail, event date, couple name, status, quick actions (view/edit/send)

**Right Sidebar (collapsible):**
- Quick filters (by month, status, team member)
- Search (couple name, venue, date)

#### 2. Proposal Builder (Core Tool)
**Left Panel (Tools):**
- Sections menu (Event Details, Mood Board, Floral Design, Pricing, Timeline)
- Florist sees everything: pricing, stem count, supplier costs

**Center Canvas (Live Preview):**
- WYSIWYG editing—what florist types is what client sees
- Drag-and-drop images, resize, rearrange
- Auto-save (no button anxiety)

**Right Panel (Client Preview):**
- Real-time mirror of client view (pricing hidden, only beauty shown)
- Client view: mood board, design details, timeline, couple story

#### 3. Inventory Management
- Grid of suppliers/flowers with costs
- Seasonal availability toggle
- Color tagging (can assign "sage" color to multiple flowers for palette matching)

#### 4. Client Communication Hub
- Message thread with client
- Proposal history (versions sent, feedback received)
- Shared mood board (client adds inspiration, florist confirms feasibility)

---

### Bride Portal (Editorial, Lightweight)
**Design Philosophy:** Beautiful, narrative-driven, low-friction

**Key Screens:**

#### 1. Intake Form (First Impression)
**Philosophy:** Intake is an invitation, not a questionnaire

**Structure:**
- Progress indicator (5 steps, visual timeline)
- Large input fields (not cramped)
- Image uploads for each section (mood board as you go, not separate)
- Section by section (not overwhelming):
  1. Your story (couple name, date, vision in 2-3 sentences)
  2. Event details (date, venue, guest count, budget)
  3. Style inspiration (upload 3–5 images or mood board)
  4. Floral preferences (any flowers you love/hate?)
  5. Logistics (delivery timing, event flow)

**Design Details:**
- Serif font for headers (bride feels seen)
- Use sage + clay for accents (not alarming colors)
- Progress bar at top (satisfying completion feeling)
- Auto-save (no lost data anxiety)

#### 2. Proposal View (Hero Experience)
**Hero section:**
- Large, beautiful main image or mood board
- Couple names + event date (serif, generous spacing)
- Florist's greeting or message

**Sections (scroll-based narrative):**
1. **Inspiration** – Florist's mood board with captions explaining choices
2. **Floral Design** – Hero image of arranged bouquet/centerpiece with poetic description
3. **Event Timeline** – Milestone moments (consultation, design finalization, delivery, event setup)
4. **Pricing** – Clean, trust-building breakdown (arrangement types, stem counts, setup time)
5. **Next Steps** – CTA buttons (approve / ask questions / sign contract)

**Design Details:**
- Full-width images, breathing room between sections
- Serif headlines, warm gray for supporting text
- Simple color palette (mostly image color + your sage/clay accents)
- No distracting UI—focus on the proposal

#### 3. Timeline & Checklist
- Horizontal or vertical timeline of key dates
- Checkpoints: design finalization, payment due, delivery, setup, final walkthrough
- Each checkpoint has a date + brief description
- Mobile: vertical scroll with card layout

#### 4. Shared Mood Board
- Collaborative board where both florist and bride can add images
- Florist's notes on feasibility ("Love this texture—similar available in garden roses")
- Bride's reactions ("This is exactly our vibe")
- Visual only (no distracting metadata)

---

## Part 7: Component Design Details & Tailwind Strategies

### Button Design System

#### Primary Action (Florist Dashboard)
```
Background:  #7A8C6E (sage, trust)
Text:        #FFFBF0 (bone/off-white, high contrast)
Padding:     12px 24px (8pt grid: 12 + 24 comfortable for florist)
Border Radius: 6px (subtle, professional)
Font Weight: 600 (confident)
Font Size:   14px (UI size)

Hover State:
  Background: #6A7C5E (darker sage, 20% darker)
  Transition: 150ms ease-in-out (smooth, not jarring)

Active State:
  Background: #5A6C4E (even darker)
  Box Shadow: inset 0 2px 4px rgba(0,0,0,0.1) (pressed feeling)

Disabled State:
  Background: #CDCDC0 (warm gray)
  Text Color: #9A9A8C (muted)
  Cursor: not-allowed
```

**Tailwind Implementation:**
```tailwind
btn-primary:
  @apply px-6 py-3 bg-sage-600 text-bone hover:bg-sage-700
    active:bg-sage-800 active:shadow-inner transition-colors duration-150
    disabled:bg-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed
    font-semibold rounded
```

#### Secondary Action (Florist: Edit/Preview)
```
Background:  Transparent
Border:      1px #B8926A (clay, secondary)
Text Color:  #B8926A
Hover State: Background: #B8926A with 10% opacity
```

#### Bride Portal CTA (Approve/Sign)
```
Background:  #7A8C6E (same sage as florist, but context is different)
Text:        #FFFBF0 (bone)
Padding:     16px 32px (more generous for bride experience)
Border Radius: 8px (slightly rounder for softer feel)
Font Size:   16px (larger for bride portal)
Font Weight: 600 (serif equivalent? could use lighter weight if serif title)

State: Same hover/active as primary, but with softer transition (200ms instead of 150ms)
```

---

### Form Input Design

#### Text Input (Florist Dashboard)
```
Background:  #FFFBF0 (bone, clean)
Border:      1px solid #DDD4C4 (subtle, warm gray)
Text Color:  #2C2C20 (near-charcoal for readability)
Padding:     12px 16px (align to 8pt grid)
Border Radius: 4px (minimal, professional)

Focus State:
  Border Color: #7A8C6E (sage, clearly focused)
  Box Shadow: 0 0 0 3px rgba(122, 140, 110, 0.1) (soft outline)

Label Style:
  Font Size: 12px
  Font Weight: 600 (sans, uppercase or sentence case?)
  Color: #8C8C7A (warm gray)
  Margin Bottom: 8px (8pt grid)
```

**Tailwind:**
```tailwind
input-primary:
  @apply px-4 py-3 bg-bone border border-gray-300 text-charcoal
    focus:border-sage-600 focus:ring-2 focus:ring-sage-100
    placeholder:text-gray-400 transition-colors rounded
```

#### Textarea (Bride Portal: Couple Story, Florist: Notes)
```
Same as text input but:
- Min Height: 120px (allow breathing room for longer thoughts)
- Font Size: 16px (larger for bride comfort on mobile)
- Line Height: 1.5 (readable, comfortable)
```

---

### Card Component (Versatile)

#### Proposal Card (Florist Dashboard)
```
Background:  #FFFBF0 (bone)
Border:      1px solid #DDD4C4 (warm gray, subtle)
Border Radius: 6px
Padding:     20px (2.5 x 8pt)
Box Shadow:  0 1px 2px rgba(0, 0, 0, 0.05) (very subtle elevation)
Hover:       Shadow increases to 0 2px 8px rgba(0, 0, 0, 0.08) (paper lifting)

Layout:
  [Thumbnail Image 100x100]  [Couple Name, Date] [Status Badge] [Quick Actions ...]
  [Venue]                    [Progress: X/5 steps complete]
```

**Tailwind:**
```tailwind
card-proposal:
  @apply bg-bone border border-gray-200 rounded-lg p-5 shadow-sm
    hover:shadow-md transition-shadow duration-200
    flex items-start gap-4
```

#### Inspiration Card (Bride Portal Mood Board)
```
Background:  Transparent or very light sage (10% opacity)
Border:      None
Image:       Full-width, high quality, 16:9 aspect ratio
Caption:     Serif font, 16px, centered below image, sage color

Hover State: Slight scale (1.02x) or slight shadow increase (shows interactivity)
```

---

### Badge/Status Indicator (Florist Dashboard)

```
Draft:       Background: #E8E0D0 (sand), Text: #8C8C7A (warm gray)
Sent:        Background: #7A8C6E (sage, 20% opacity), Text: #5A6C4E (dark sage)
Approved:    Background: #9CBE3C (soft green, accessible), Text: #FFFBF0 (bone)
Invoiced:    Background: #B8926A (clay, 20% opacity), Text: #7A6E52 (dark clay)
Delivered:   Background: #4A5C3E (deep green), Text: #FFFBF0 (bone)

Size:        Padding: 4px 12px, Font: 12px, Font Weight: 600, Border Radius: 12px
```

**Tailwind Approach (using custom color tokens):**
```tailwind
badge-status:
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold

badge-draft:
  @apply bg-sand-100 text-gray-700

badge-approved:
  @apply bg-green-100 text-green-800

badge-delivered:
  @apply bg-sage-700 text-bone
```

---

### Modal/Dialog (Florist: Confirm Actions)

```
Overlay:     Transparent black (20% opacity) – lets dashboard show through
Modal Box:   Background: #FFFBF0 (bone), Border Radius: 8px, Max Width: 500px
Padding:     32px (4 x 8pt)
Shadow:      0 10px 40px rgba(0, 0, 0, 0.15) (elevated, not floating)

Title:       24px, Sans Bold, Warm Gray
Body:        16px, Sans Regular, Charcoal
Actions:     Two buttons (Cancel, Confirm) stacked or side-by-side (depending on space)

Close (X):   Top right, subtle, hover becomes sage color
```

**Florist Example (Delete Proposal):**
```
Title: "Delete this proposal?"
Body: "This can't be undone. The client will no longer see this proposal."
Buttons: [Cancel] [Delete] (Delete in red for destructive)
```

---

### Empty State (When No Proposals Yet)

**Philosophy:** Encouraging, not error-like

```
Icon:        Large (96x96), sage color, simple outline (e.g., document with flower)
Heading:     24px, Serif, Warm Gray – "Time to create something beautiful"
Description: 16px, Sans, Charcoal – "Your first proposal will show up here"
CTA:         Primary button – "Create Proposal"

Background:  Light sage (5% opacity) or bone
Padding:     64px top/bottom, centered on screen
```

---

### Sidebar Navigation (Florist Dashboard)

```
Width:       250px (collapsed: 80px for icons only)
Background:  Bone (#FFFBF0) or very light gray (#F5F1E8)
Items:       40px height, with icon + label (or icon only when collapsed)

Active Item:
  Background: Sage (#7A8C6E) with 10% opacity
  Border Left: 3px solid sage (accent)
  Text Color: #5A6C4E (dark sage)
  Font Weight: 600

Inactive Item:
  Text Color: #8C8C7A (warm gray)
  Hover: Background: Sage 5% opacity (preview active state)

Separator:   1px solid #DDD4C4 between logical groups
Padding:     12px left/right (1.5 x 8pt)
Font Size:   14px
```

---

## Part 8: Specific CSS/Tailwind Strategies

### Color Token System (Tailwind Config)

```javascript
module.exports = {
  theme: {
    colors: {
      // Brand palette
      sand: {
        50:  '#F9F8F5',
        100: '#F2EFE8',
        200: '#E8E0D0', // primary background
        300: '#DDD4C4',
      },
      sage: {
        50:  '#F1F3EF',
        600: '#7A8C6E', // primary action
        700: '#6A7C5E', // hover
        800: '#5A6C4E', // active
      },
      clay: {
        100: '#E8DFD0',
        600: '#B8926A', // secondary accent
        700: '#A8825A',
      },
      gray: {
        400: '#CDCDC0',
        700: '#8C8C7A', // warm gray for UI text
      },
      charcoal: '#2C2C20', // primary text
      bone:     '#FFFBF0',  // backgrounds

      // Semantic colors
      success: '#9CBE3C',
      alert:   '#D97F3F',
      info:    '#3B7A8E',
    },
    spacing: {
      px:   '1px',
      0:    '0',
      1:    '4px',
      2:    '8px',
      3:    '12px',
      4:    '16px',
      5:    '20px',
      6:    '24px',
      8:    '32px',
      10:   '40px',
      12:   '48px',
      14:   '56px',
    },
    fontFamily: {
      serif: ['Crimson Pro', 'Cardo', 'serif'],
      sans:  ['Inter', 'Source Sans Pro', 'system-ui', 'sans-serif'],
      mono:  ['IBM Plex Mono', 'monospace'],
    },
    fontSize: {
      xs:  ['12px', { lineHeight: '16px' }],
      sm:  ['14px', { lineHeight: '20px' }],
      base:['16px', { lineHeight: '24px' }],
      lg:  ['18px', { lineHeight: '28px' }],
      xl:  ['24px', { lineHeight: '32px' }],
      2xl: ['32px', { lineHeight: '40px' }],
      3xl: ['48px', { lineHeight: '56px' }],
    },
    shadows: {
      none:    'none',
      sm:      '0 1px 2px rgba(0, 0, 0, 0.05)',
      md:      '0 2px 8px rgba(0, 0, 0, 0.08)',
      lg:      '0 10px 40px rgba(0, 0, 0, 0.15)',
      inner:   'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    borderRadius: {
      none: '0',
      sm:   '4px',
      base: '6px',
      lg:   '8px',
      full: '9999px',
    },
  },
}
```

### Component Class System

```css
/* Buttons */
.btn {
  @apply font-semibold rounded transition-colors duration-150
    disabled:cursor-not-allowed disabled:opacity-60;
}

.btn-primary {
  @apply bg-sage-600 text-bone hover:bg-sage-700
    active:bg-sage-800 active:shadow-inner px-6 py-3;
}

.btn-secondary {
  @apply bg-transparent border border-clay-600 text-clay-600
    hover:bg-clay-600/10 px-6 py-3;
}

.btn-small {
  @apply px-3 py-2 text-xs font-medium;
}

/* Form Elements */
.input-base {
  @apply px-4 py-3 bg-bone border border-sand-300 text-charcoal
    placeholder:text-gray-400 rounded transition-colors duration-150;
}

.input-base:focus {
  @apply border-sage-600 ring-2 ring-sage-600/20 outline-none;
}

.label-base {
  @apply block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide;
}

/* Cards */
.card {
  @apply bg-bone border border-sand-300 rounded-lg p-5
    shadow-sm hover:shadow-md transition-shadow duration-200;
}

/* Status Badges */
.badge {
  @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold;
}

.badge-approved {
  @apply bg-success/20 text-success;
}

.badge-pending {
  @apply bg-clay-100 text-clay-700;
}

/* Typography */
.text-headline {
  @apply font-serif font-bold text-2xl/tight text-charcoal;
}

.text-subheading {
  @apply font-serif text-xl/snug text-gray-700;
}

.text-caption {
  @apply text-xs text-gray-700 uppercase tracking-wide;
}
```

### Micro-interaction Animations (CSS/Tailwind)

```css
/* Soft fade and slide for notifications */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification {
  @apply animate-in fade-in-50 slide-in-from-top duration-200;
}

/* Loading shimmer */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  @apply bg-gradient-to-r from-sand-200 via-sand-100 to-sand-200
    bg-[length:1000px_100%] animate-pulse;
}

/* Pulse for pending states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.pulse-pending {
  @apply animate-pulse;
}

/* Hover lift on cards */
.card-hover {
  @apply transition-all duration-200 hover:-translate-y-1 hover:shadow-md;
}
```

---

## Part 9: Florist vs. Bride Experience at a Glance

| Dimension | Florist Dashboard | Bride Portal |
|-----------|-------------------|--------------|
| **Typography** | Sans serif (Inter) for clarity, speed | Serif (Crimson Pro) for emotion, editorial feel |
| **Layout** | Information-dense, 2–3 columns, left nav | Spacious, single column, scroll-based narrative |
| **Color Dominance** | Sage + charcoal (trust + authority) | Sage + clay + lots of white (softer, romantic) |
| **Images** | Functional (proposal thumbnail, inventory), medium size | Hero images, full-width, high quality, carefully curated |
| **Mobile** | Optimized for field work, quick actions | Optimized for browsing, image-heavy, passive consumption |
| **Interactions** | Drag-drop, inline edit, quick status update | Swipe through mood board, scroll timeline, read narrative |
| **Data Visible** | Pricing, stem counts, costs, timeline, team assignments | Budget (high-level), timeline, proposal story, approval status only |
| **Emotional Tone** | Competent, professional, tool-like | Elevated, editorial, romantic, curated |
| **Call to Action** | "Create Proposal," "Send to Client," "Update Status" | "Approve," "Schedule Consultation," "Sign Agreement" |
| **Feedback** | Quick, direct (status badge, success notification) | Poetic, encouraging ("Your vision is ready," "Next: signature") |

---

## Part 10: Actionable Implementation Roadmap

### Phase 1: Design System (Week 1–2)
- [ ] Create Figma design system with components: buttons, inputs, cards, badges, modals
- [ ] Set up Tailwind config with color tokens, spacing, typography
- [ ] Define micro-interaction library (hover states, loading, success, error)
- [ ] Create component variants (default, hover, active, disabled, loading)

### Phase 2: Florist Dashboard (Week 3–5)
- [ ] Design home dashboard (KPI snapshot)
- [ ] Design proposal builder (canvas + preview panes)
- [ ] Design client list, proposal list, inventory management
- [ ] Design sidebar navigation
- [ ] Build responsive mobile experience

### Phase 3: Bride Portal (Week 6–8)
- [ ] Design intake form (5-step, visually guided)
- [ ] Design proposal view (editorial, scroll-based)
- [ ] Design timeline + checklist
- [ ] Design shared mood board interface
- [ ] Optimize for mobile (bride viewing on phone)

### Phase 4: Polish & Refinement (Week 9–10)
- [ ] Test information hierarchy on real florists
- [ ] Verify accessibility (color contrast, focus states)
- [ ] Refine micro-interactions based on user feedback
- [ ] Document design decisions and handoff to dev

### Phase 5: Dev Handoff
- [ ] Export components as Figma tokens
- [ ] Provide Tailwind class reference
- [ ] Share design system documentation
- [ ] Create interaction specs (300ms max for animations, etc.)

---

## Part 11: Reference Products & Design Inspiration

### Florist-Facing SaaS
- **Curate.co** – Drag-and-drop proposals, single-screen workflow, auto-save
- **HoneyBook.com** – Dashboard snapshot, integrated payments, workflow automation
- **AislePlanner.com** – Mood boards, color palettes, role-based access
- **BloomsBy** (iPad app) – Mobile-first for in-field consultations

### Luxury Editorial + Wedding Design
- **Kinfolk.com** – Typography study (serif + sans harmony, generous spacing)
- **TheLane.com** – Cinematic editorial, poetic captions, layered visuals
- **MarthaStewartWeddings.com** – Detail-rich styling, tradition, personality
- **OnceWed.com** – Curated florals, mood-focused inspiration

### Modern SaaS Dashboards
- **Figma.com** – Information hierarchy, contextual panels, professional tool feel
- **Notion.so** – Visual + data balance, flexible layouts, role-based views
- **Linear.app** – Minimalist aesthetic, subtle interactions, focused information

---

## Conclusion

Fauna's design challenge is to be **two tools in one**: a capable, information-dense dashboard for florists and a beautiful, emotionally resonant portal for brides. The earthy color palette (sand, sage, clay) creates a unified brand across both experiences, while typography (serif for bride moments, sans for florist tools) maintains distinct personalities.

Key guardrails:
1. **Florist view:** Tool-like, fast, complete information visible
2. **Bride view:** Editorial, narrative, focused on beauty
3. **Color strategy:** Warm neutrals + sage, 40% density max, micro-interactions under 300ms
4. **Typography:** Serif for emotional moments, sans for clarity
5. **Mobile:** Field-optimized for florists, scroll-optimized for brides
6. **Spacing:** Rigorous 8pt grid for consistency, generous breathing room for editorial feel

This brief distills patterns from top-tier florist SaaS, editorial design, and modern dashboards into concrete, implementable guidance.

---

## Sources Cited

1. [Curate Florist Software](https://curate.co/florist-software/)
2. [HoneyBook](https://www.honeybook.com/)
3. [Aisle Planner Solutions](https://www.aisleplanner.com/solutions/tools-for-floral-designers)
4. [Kinfolk Magazine Redesign](https://www.itsnicethat.com/news/kinfolk-tenth-anniversary-redesign-schick-toikka-publication-graphic-design-230621)
5. [The Lane Wedding Editorial](https://thelane.com/)
6. [SaaS Dashboard Design Best Practices 2025](https://www.context.dev/blog/dashboard-design-best-practices)
7. [Luxury Wedding Font Pairings](https://www.avelawhite.com/journal/our-favourite-fonts-of-2025)
8. [Mobile UX Design Patterns](https://www.eleken.co/blog-posts/mobile-ux-design-examples)
9. [8-Point Grid System](https://www.freecodecamp.org/news/8-point-grid-typography-on-the-web-be5dc97db6bc)
10. [Micro-interactions in SaaS](https://medium.com/@ryan.almeida86/5-micro-interactions-to-make-any-product-feel-premium-68e3b3eae3bf)
11. [Client Intake Form Best Practices](https://getzendo.io/blog/intake-form/)
12. [Wedding Color Trends 2025](https://www.theknot.com/content/wedding-color-palettes-we-love)
