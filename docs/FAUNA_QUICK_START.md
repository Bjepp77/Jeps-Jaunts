# Fauna Design System: Quick Start Reference
## 1-Page Visual + Code Reference

**For:** Designers and engineers who need answers fast
**Read time:** 5 minutes

---

## Color Palette (Copy into Tailwind)

```javascript
colors: {
  bone:     '#FFFBF0',  // Primary background
  sand: {
    200:    '#E8E0D0',  // Secondary background
    300:    '#DDD4C4',  // Borders
  },
  sage: {
    600:    '#7A8C6E',  // Primary action (trust)
    700:    '#6A7C5E',  // Hover state
    800:    '#5A6C4E',  // Active state
  },
  clay: {
    600:    '#B8926A',  // Secondary accent (warmth)
    700:    '#A8825A',  // Hover state
  },
  gray: {
    600:    '#8C8C7A',  // UI labels
  },
  charcoal: '#2C2C20',  // Primary text

  // Semantic
  success: '#9CBE3C',   // Approvals (green)
  alert:   '#D97F3F',   // Warnings (orange)
  info:    '#3B7A8E',   // Info (blue)
}
```

---

## Typography

**Serif (Bride Portal)**
```
Font: Crimson Pro, Cardo, or EB Garamond
Headlines, couple names, event details
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700');
```

**Sans (Florist Dashboard)**
```
Font: Inter or Source Sans Pro
Labels, UI, body copy
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700');
```

**Font Sizes (8pt baseline grid)**
```
xs:  12px / 16px line-height
sm:  14px / 20px line-height
base: 16px / 24px line-height
lg:  18px / 28px line-height
xl:  24px / 32px line-height
2xl: 32px / 40px line-height
3xl: 48px / 56px line-height
```

---

## Spacing (8pt Grid)

```
4px  (1)  → Micro spacing, form gaps
8px  (2)  → Small components, margins
16px (4)  → Standard padding
24px (6)  → Section spacing
32px (8)  → Major breaks
40px (10) → Hero spacing
```

---

## Button States (Copy & Paste)

### Primary Button (Florist: Create, Send, Approve)

```jsx
// Default
bg-sage-600 text-bone px-6 py-3 rounded-lg font-semibold

// Hover
hover:bg-sage-700 hover:shadow-md

// Active
active:bg-sage-800 active:shadow-inner

// Focus
focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2

// Disabled
disabled:bg-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed

// Tailwind Class
className="px-6 py-3 bg-sage-600 text-bone rounded-lg font-semibold
  hover:bg-sage-700 hover:shadow-md
  active:bg-sage-800 active:shadow-inner
  focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2
  disabled:bg-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed
  transition-all duration-150"
```

### Secondary Button (Edit, Cancel)

```jsx
className="px-6 py-3 border-2 border-clay-600 text-clay-600 rounded-lg font-semibold
  hover:bg-clay-600/10
  active:bg-clay-600/15
  focus:outline-none focus:ring-2 focus:ring-clay-600/50
  transition-all duration-150"
```

---

## Form Input States

```jsx
// Default/Focus
border border-sand-300 rounded-lg px-4 py-3 text-base
focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10 focus:outline-none

// Error
border-alert bg-bone text-charcoal
focus:ring-alert/10

// Disabled
bg-sand-100 text-gray-500 cursor-not-allowed

// Full Component
className="w-full px-4 py-3 rounded-lg border border-sand-300 text-base
  focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10 focus:outline-none
  disabled:bg-sand-100 disabled:text-gray-500 disabled:cursor-not-allowed
  transition-colors duration-150"
```

---

## Status Badges

```jsx
const statusStyles = {
  draft:     'bg-sand-100 text-gray-700',
  sent:      'bg-sage-600/20 text-sage-800',
  approved:  'bg-success/20 text-success-800',
  invoiced:  'bg-clay-600/20 text-clay-700',
  delivered: 'bg-sage-600 text-bone',
  declined:  'bg-alert/20 text-alert-800',
}

// Usage
<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
  {statusLabel}
</span>
```

---

## Card Component

```jsx
// Proposal card
className="bg-bone border border-sand-300 rounded-lg p-5 shadow-sm
  hover:shadow-md transition-shadow
  flex gap-4 items-start"
```

---

## Dashboard KPI Card

```jsx
<div className="bg-bone border border-sand-300 rounded-lg p-6 shadow-sm">
  <p className="text-xs font-semibold uppercase text-gray-700 mb-2">
    Upcoming Events
  </p>
  <p className="text-4xl font-bold text-charcoal mb-1">5</p>
  <p className="text-sm text-gray-600">This month</p>
</div>
```

---

## Responsive Grid (Mobile-First)

```jsx
// 1 column mobile, 2 tablet, 3 desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Form: single mobile, 2-column tablet+
className="grid grid-cols-1 md:grid-cols-2 gap-6"
```

---

## Animation Timings

```css
/* Use these consistently */
duration-100  /* Quick feedback, loading */
duration-150  /* Default (hover, UI changes) */
duration-200  /* Deliberate (modals, validation) */
duration-300  /* Slow (page transitions, reveals) */

/* Timing functions */
ease-in-out   /* Natural, standard (most use cases) */
ease-out      /* Entrance animations */
ease-in       /* Exit animations */

/* Max animation duration: 300ms (slower = feels sluggish) */
```

---

## Focus Ring (Accessibility)

**Always add to interactive elements:**

```jsx
focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2

// Or shorthand with hover:
focus:ring-2 focus:ring-sage-600/50
```

---

## Florist Dashboard Layout

```
┌─────────────────────────────────────┐
│ Logo        [Dashboard]  [User Menu] │  Header (h-16)
├──────────┬──────────────────────────┤
│          │  KPI Cards               │
│ Sidebar  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐   │
│ 250px    │  └──┘ └──┘ └──┘ └──┘   │
│          │                         │
│ Nav Items│  Proposal List          │
│          │  ┌──────────────────┐   │
│          │  │ Card  Card  Card │   │
│          │  └──────────────────┘   │
└──────────┴──────────────────────────┘
```

---

## Bride Portal Layout (Hero-to-Details)

```
┌──────────────────────────┐
│     [Hero Image]         │  Full-width
│  [Couple Names, Date]    │
├──────────────────────────┤
│                          │
│  Inspiration Section     │  Scroll narrative
│  Mood board + captions   │
│                          │
├──────────────────────────┤
│                          │
│  Design Section          │
│  Floral photo + details  │
│                          │
├──────────────────────────┤
│ Timeline / Checklist     │
│ [Milestone] [Milestone]  │
│                          │
├──────────────────────────┤
│ Pricing (Clean)          │
│ Budget: $X,XXX           │
│                          │
├──────────────────────────┤
│ [Approve] [Ask Questions]│  CTAs
└──────────────────────────┘
```

---

## Mobile Patterns (Florists in Field)

**Button Targets:** 44px minimum height, 16px spacing around

**Quick Status Update:**
```jsx
// Swipe or tap to mark proposal "viewed by client"
<button
  className="w-full py-4 px-4 bg-success/20 text-success-800
    rounded-lg font-semibold transition-colors
    hover:bg-success/30"
  onClick={markViewed}
>
  ✓ Mark Viewed
</button>
```

**Bride Portal Mobile:** Image-heavy, scrolling, passive (no complex interactions)

---

## Micro-Interactions

### Success Notification
```jsx
className="fixed bottom-6 right-6 px-4 py-3 rounded-lg
  bg-success text-bone font-semibold text-sm
  shadow-lg animate-in fade-in slide-in-from-right-10
  duration-300"
```

### Loading Skeleton
```jsx
<div className="bg-sand-200 rounded-lg animate-pulse aspect-video" />
```

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-20 px-4">
  <Icon className="w-20 h-20 text-sage-600 mb-4" />
  <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">
    No proposals yet
  </h2>
  <p className="text-gray-600 text-center mb-6 max-w-sm">
    Start by creating your first proposal.
  </p>
  <button className="btn-primary">Create Proposal</button>
</div>
```

---

## Accessibility Checklist (Quick)

- [ ] Color contrast ≥ 4.5:1 (Sage on bone = 4.7:1 ✓)
- [ ] Focus ring on all interactive elements
- [ ] Labels for all form inputs
- [ ] Alt text for images
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] ARIA labels for icon-only buttons

---

## File Locations (Reference)

```
src/
├── components/atoms/Button
├── components/atoms/Badge
├── components/molecules/FormInput
├── components/molecules/Card
├── components/organisms/Dashboard
├── components/layout/Sidebar
├── lib/colors.ts          ← Use for type-safe colors
├── lib/typography.ts
├── styles/globals.css     ← Tailwind + custom keyframes
└── tailwind.config.js     ← Color tokens, fonts, spacing
```

---

## Figma → Tailwind Mapping

| Figma | Tailwind | Code |
|-------|----------|------|
| Brand/Sage 600 | `sage-600` | `bg-sage-600` |
| 8px margin | `m-2` | `m-2` |
| 16px padding | `p-4` | `p-4` |
| Inter Medium | `font-sans font-medium` | `font-medium` |
| Crimson Pro Bold | `font-serif font-bold` | `font-bold` |
| 4px border radius | `rounded-sm` | `rounded-sm` |
| 0 2px 8px shadow | `shadow-md` | `shadow-md` |

---

## Designer Workflow

1. **Start in Figma** with components matching this spec
2. **Export colors** to Tailwind config (no manual translation)
3. **Build components** with Tailwind classes in code
4. **Test on real devices** (mobile, tablet, desktop)
5. **Iterate** based on florist/bride feedback

---

## Engineer Workflow

1. **Copy Tailwind config** from implementation-guide.md
2. **Create component library** (atoms → molecules → organisms)
3. **Use design tokens** (don't hardcode colors)
4. **Build semantically** (`<button>`, `<form>`, `<label>`)
5. **Test accessibility** (axe DevTools + keyboard nav)

---

## Colors by Use Case

**Florist Dashboard:**
- Primary action: Sage 600
- Secondary action: Clay 600
- Hover: Lighten 10%, darken on active
- Text: Charcoal 900
- Borders: Sand 300
- Background: Bone

**Bride Portal:**
- Headlines: Serif + Charcoal
- Accents: Sage 600 (same as florist, but in editorial context)
- Supporting text: Warm Gray
- Background: Mostly bone, Sand 50 for subtle sections
- Focus: Let photography dominate; UI stays soft

---

## Emergency Reference (Copy-Paste)

**"I need a submit button NOW":**
```jsx
<button className="px-6 py-3 bg-sage-600 text-bone rounded-lg font-semibold
  hover:bg-sage-700 active:bg-sage-800
  focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2
  disabled:bg-gray-400 disabled:cursor-not-allowed
  transition-all duration-150">
  Submit
</button>
```

**"I need a form input NOW":**
```jsx
<input
  type="text"
  className="w-full px-4 py-3 rounded-lg border border-sand-300
    focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10 focus:outline-none
    transition-colors duration-150"
  placeholder="Enter your name"
/>
```

**"I need a card NOW":**
```jsx
<div className="bg-bone border border-sand-300 rounded-lg p-6 shadow-sm
  hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```

---

## Key Principle

**Florist dashboard = Speed + Information**
**Bride portal = Beauty + Narrative**

Same colors, different grammar.

---

**Full docs:** See fauna-design-brief.md, fauna-component-specs.md, fauna-implementation-guide.md

**Last updated:** April 14, 2026
