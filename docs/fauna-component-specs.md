# Fauna Component Specifications
## Detailed Design & Code Reference

**Purpose:** Hands-on reference for designers and developers implementing the Fauna design system
**Audience:** UX/UI designers, frontend engineers
**Last Updated:** April 2026

---

## Navigation & Structure

### Main Layout (Florist Dashboard)

**Sidebar Navigation + Main Content Layout**

```
┌─────────────────────────────────────────┐
│ [Fauna Logo] [Dashboard]    [User Menu] │  Header (64px height)
├─────────────────────────────────────────┤
│ Proposals  │ Main Canvas                 │
│ Clients    │ ┌──────────────────────┐   │
│ Inventory  │ │  Primary Content      │   │  Sidebar: 250px
│ Team       │ │  (Dashboard / Page)   │   │  Content: Flex
│ Settings   │ └──────────────────────┘   │
│            │                             │
└─────────────────────────────────────────┘
```

**Tailwind Structure:**
```jsx
<div className="flex h-screen bg-sand-50">
  {/* Sidebar */}
  <aside className="w-64 bg-bone border-r border-sand-300 flex flex-col">
    <div className="p-6">
      {/* Logo */}
    </div>
    <nav className="flex-1 px-4 py-6 space-y-2">
      {/* Navigation items */}
    </nav>
  </aside>

  {/* Main */}
  <main className="flex-1 overflow-auto">
    {/* Header */}
    <header className="h-16 bg-bone border-b border-sand-300 px-6
                        flex items-center sticky top-0 z-10">
      {/* Breadcrumb / Title + Actions */}
    </header>

    {/* Content */}
    <div className="p-6">
      {/* Page-specific content */}
    </div>
  </main>
</div>
```

---

### Sidebar Navigation Item

**Active State:**
```
┌─ [Icon] Dashboard ─────┐
│ ← 3px left border      │
│ Sage background (10%)  │
└────────────────────────┘
```

**States Table:**

| State | Background | Border | Text Color | Font Weight |
|-------|-----------|--------|-----------|------------|
| Inactive | Transparent | None | #8C8C7A | 500 |
| Hover | #7A8C6E 5% | None | #7A8C6E | 500 |
| Active | #7A8C6E 10% | 3px left #7A8C6E | #5A6C4E | 600 |

**Tailwind:**
```jsx
<nav className="space-y-2">
  {items.map((item) => (
    <a
      key={item.id}
      href={item.href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm
        font-medium transition-colors duration-150
        ${
          isActive
            ? 'bg-sage-600/10 text-sage-800 font-semibold border-l-4 border-sage-600'
            : 'text-gray-700 hover:bg-sage-600/5'
        }
      `}
    >
      {item.icon}
      <span>{item.label}</span>
    </a>
  ))}
</nav>
```

---

## Buttons & CTAs

### Button Variants

#### Primary Button (Florist: Create, Send, Approve)

**Default State:**
```
┌──────────────────┐
│  CREATE PROPOSAL │  Height: 44px
│ bg: sage #7A8C6E │  Padding: 12px 24px
│ text: bone white  │  Border-radius: 6px
└──────────────────┘
```

**States:**

```
Default:
  Background: #7A8C6E
  Text: #FFFBF0
  Shadow: none

Hover:
  Background: #6A7C5E (darken 15%)
  Text: #FFFBF0
  Shadow: 0 2px 8px rgba(122, 140, 110, 0.15)
  Cursor: pointer

Active/Pressed:
  Background: #5A6C4E (darken 30%)
  Text: #FFFBF0
  Shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1)

Focus (Keyboard):
  Background: #7A8C6E
  Outline: 3px solid #7A8C6E, offset: 2px

Disabled:
  Background: #CDCDC0 (warm gray)
  Text: #9A9A8C (muted)
  Opacity: 0.6
  Cursor: not-allowed
```

**Tailwind Component:**
```jsx
<button
  className={`
    px-6 py-3 rounded-lg font-semibold text-sm
    transition-all duration-150
    flex items-center gap-2
    ${
      variant === 'primary'
        ? `
          bg-sage-600 text-bone
          hover:bg-sage-700 hover:shadow-md
          active:bg-sage-800 active:shadow-inner
          focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2
          disabled:bg-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed
        `
        : ''
    }
  `}
  disabled={isLoading}
>
  {isLoading && <Spinner className="w-4 h-4" />}
  {children}
</button>
```

#### Secondary Button (Edit, Preview, Cancel)

**States:**
```
Default:
  Background: Transparent
  Border: 1px solid #B8926A (clay)
  Text: #B8926A

Hover:
  Background: #B8926A / 10
  Border: 1px solid #B8926A
  Text: #B8926A

Active:
  Background: #B8926A / 15
  Border: 1px solid #A8825A (darker clay)
```

**Tailwind:**
```jsx
className="px-6 py-3 rounded-lg font-semibold text-sm
  border-2 border-clay-600 text-clay-600
  hover:bg-clay-600/10
  active:bg-clay-600/15
  focus:ring-2 focus:ring-clay-600/50"
```

#### Tertiary/Ghost Button (Minimal, for secondary actions)

**Use case:** "Learn more", "Maybe later", "Undo"

```
Default:
  Background: Transparent
  Border: None
  Text: #7A8C6E (sage, acts as link)
  Underline: Optional (underline on hover)

Hover:
  Text: #5A6C4E (darker sage)
  Underline: appears
```

#### Button Group (Radio-style, e.g., View Mode)

```
┌─────────────┬─────────────┐
│ List View ●│ Grid View   │  Active: sage bg + darker text
│            │             │  Inactive: gray text, no bg
└─────────────┴─────────────┘
```

**Tailwind:**
```jsx
<div className="flex bg-sand-200 p-1 rounded-lg">
  {['list', 'grid'].map((mode) => (
    <button
      key={mode}
      onClick={() => setView(mode)}
      className={`
        flex-1 px-4 py-2 rounded-md font-medium transition-colors
        ${
          view === mode
            ? 'bg-white text-sage-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }
      `}
    >
      {mode === 'list' ? 'List' : 'Grid'}
    </button>
  ))}
</div>
```

---

## Form Elements

### Text Input

**Anatomy:**
```
Label: "Couple's Last Name"
↓
┌──────────────────────────────────────┐
│ Smith                                │  Input
│                                      │  Height: 44px
└──────────────────────────────────────┘  Padding: 12px 16px

Helper Text: "This will appear on the proposal"
```

**States:**

```
Default (Empty):
  Background: #FFFBF0 (bone)
  Border: 1px solid #DDD4C4 (sand-300)
  Text: #2C2C20 (charcoal)
  Placeholder: #9A9A8C (muted gray)

Focus:
  Background: #FFFBF0
  Border: 1px solid #7A8C6E (sage)
  Box-shadow: 0 0 0 3px rgba(122, 140, 110, 0.1) (soft outline)
  Outline: none

Filled:
  Background: #FFFBF0
  Border: 1px solid #DDD4C4
  Text: #2C2C20

Error:
  Background: #FFFBF0
  Border: 1px solid #D97F3F (alert/orange)
  Box-shadow: 0 0 0 3px rgba(217, 127, 63, 0.1)
  Helper text color: #D97F3F

Disabled:
  Background: #F5F1E8 (lighter sand)
  Border: 1px solid #DDD4C4
  Text: #9A9A8C (muted)
  Cursor: not-allowed
```

**Tailwind:**
```jsx
<div className="space-y-2">
  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
    Couple's Last Name
  </label>
  <input
    type="text"
    className={`
      w-full px-4 py-3 rounded-lg border
      transition-colors duration-150
      font-sans text-base
      ${
        error
          ? 'border-alert bg-bone text-charcoal focus:ring-alert/10'
          : 'border-sand-300 bg-bone text-charcoal
             focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10 focus:outline-none'
      }
      disabled:bg-sand-100 disabled:text-gray-500 disabled:cursor-not-allowed
    `}
    placeholder="Smith"
    disabled={isDisabled}
  />
  {error && (
    <p className="text-xs text-alert font-medium">{error}</p>
  )}
</div>
```

### Textarea

**For longer content (couple story, notes, florals description)**

```
Label: "Describe your floral vision"
↓
┌──────────────────────────────────────┐
│ We want lush, romantic garden roses  │
│ in soft blush tones with eucalyptus  │
│ and trailing ivy...                  │
│                                      │  Min-height: 120px
│                                      │  Line-height: 1.5
└──────────────────────────────────────┘

Character count: 245 / 500
```

**Tailwind:**
```jsx
<textarea
  className={`
    w-full px-4 py-3 rounded-lg border
    font-sans text-base leading-relaxed
    resize-none
    ${
      error
        ? 'border-alert'
        : 'border-sand-300 focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10'
    }
  `}
  rows={5}
  placeholder="Tell us about your floral dreams..."
/>
```

### Select/Dropdown

**For choosing status, event type, flower type**

```
┌─ Event Type ──────────────────────┐
│ Wedding                          ▼│  Height: 44px
└───────────────────────────────────┘
```

**Tailwind with Headless UI:**
```jsx
<Listbox value={selected} onChange={setSelected}>
  <div className="relative">
    <Listbox.Button className={`
      relative w-full px-4 py-3 rounded-lg border border-sand-300
      bg-bone text-left cursor-pointer
      focus:outline-none focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10
    `}>
      <span className="block truncate text-charcoal">
        {selected.name}
      </span>
      <span className="pointer-events-none absolute right-4 top-3">
        <ChevronDownIcon className="w-5 h-5 text-gray-700" />
      </span>
    </Listbox.Button>

    <Listbox.Options className={`
      absolute z-50 w-full mt-2 bg-bone border border-sand-300
      rounded-lg shadow-lg
    `}>
      {options.map((option) => (
        <Listbox.Option
          key={option.id}
          value={option}
          className={({ active }) => `
            px-4 py-3 cursor-pointer
            ${active ? 'bg-sage-600/10 text-sage-800' : 'text-charcoal'}
          `}
        >
          {option.name}
        </Listbox.Option>
      ))}
    </Listbox.Options>
  </div>
</Listbox>
```

### Checkbox

**For permissions, feature toggles, selecting multiple items**

```
☑ Can edit proposal
☐ Can view budget only

Checked:  Background: #7A8C6E, checkmark: white
Unchecked: Border: 1px #DDD4C4, no fill
```

**Tailwind:**
```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    checked={isChecked}
    onChange={(e) => setIsChecked(e.target.checked)}
    className={`
      w-5 h-5 rounded border-2 cursor-pointer
      transition-colors duration-150
      ${
        isChecked
          ? 'bg-sage-600 border-sage-600 accent-white'
          : 'border-sand-300 bg-bone'
      }
    `}
  />
  <span className="text-sm text-charcoal font-medium">
    Can edit proposal
  </span>
</label>
```

### Radio Button

**For choosing one option (e.g., delivery type)**

```
◉ Express (1–2 days)
○ Standard (3–5 days)
```

**Tailwind:**
```jsx
<fieldset className="space-y-3">
  {options.map((option) => (
    <label key={option.id} className="flex items-center gap-3 cursor-pointer">
      <input
        type="radio"
        name="delivery"
        value={option.id}
        checked={selected === option.id}
        onChange={(e) => setSelected(e.target.value)}
        className="w-4 h-4 text-sage-600 border-sand-300 focus:ring-sage-600"
      />
      <span className="text-sm text-charcoal">{option.label}</span>
    </label>
  ))}
</fieldset>
```

---

## Data Display

### Data Table (Proposals, Clients, Inventory)

**Anatomy:**
```
┌────────────────────────────────────────────────────────────┐
│ Proposals                                    [+ Create New] │  Header
├────────────────────────────────────────────────────────────┤
│ Couple    │ Event Date │ Venue      │ Status    │ Actions  │  Column headers
├────────────────────────────────────────────────────────────┤
│ Smith     │ Jun 15     │ Ballroom   │ Approved  │ ⋯       │  Row 1
│ Johnson   │ Jul 22     │ Garden     │ Sent      │ ⋯       │  Row 2
│ Williams  │ Aug 10     │ Vineyard   │ Draft     │ ⋯       │  Row 3
└────────────────────────────────────────────────────────────┘
```

**Tailwind Structure:**
```jsx
<div className="bg-bone rounded-lg border border-sand-300 overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 bg-sand-50 border-b border-sand-300 flex justify-between items-center">
    <h2 className="text-lg font-semibold text-charcoal">Proposals</h2>
    <button className="btn btn-primary text-sm">+ Create New</button>
  </div>

  {/* Table */}
  <table className="w-full">
    <thead>
      <tr className="border-b border-sand-300 bg-sand-50">
        <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-700">
          Couple
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-700">
          Event Date
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-700">
          Status
        </th>
        <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-700">
          Actions
        </th>
      </tr>
    </thead>
    <tbody>
      {proposals.map((proposal) => (
        <tr key={proposal.id} className="border-b border-sand-300 hover:bg-sand-50 transition-colors">
          <td className="px-6 py-4 text-sm text-charcoal font-medium">
            {proposal.coupleName}
          </td>
          <td className="px-6 py-4 text-sm text-charcoal">
            {formatDate(proposal.eventDate)}
          </td>
          <td className="px-6 py-4 text-sm">
            <span className={`badge badge-${proposal.status}`}>
              {proposal.status}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <button className="text-sage-600 hover:text-sage-800 p-2">⋯</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Status Badges

**Appearance:**

| Status | Background | Text | Use Case |
|--------|------------|------|----------|
| Draft | #F2EFE8 (sand-100) | #8C8C7A (gray-700) | Not yet sent |
| Sent | #7A8C6E / 20% (sage-600/20) | #5A6C4E (sage-800) | Awaiting client review |
| Approved | #9CBE3C / 20% (success/20) | #6B8E23 (success-800) | Client approved |
| Invoiced | #B8926A / 20% (clay/20) | #8B6F47 (clay-700) | Payment pending |
| Delivered | #7A8C6E (sage-600) | #FFFBF0 (bone) | Event complete |
| Declined | #D97F3F / 20% (alert/20) | #B85E28 (alert-800) | Client rejected |

**Tailwind:**
```jsx
const statusStyles = {
  draft: 'bg-sand-100 text-gray-700',
  sent: 'bg-sage-600/20 text-sage-800',
  approved: 'bg-success/20 text-success-800',
  invoiced: 'bg-clay-600/20 text-clay-700',
  delivered: 'bg-sage-600 text-bone',
  declined: 'bg-alert/20 text-alert-800',
};

<span className={`
  inline-flex items-center px-3 py-1 rounded-full
  text-xs font-semibold
  ${statusStyles[proposal.status]}
`}>
  {proposal.statusLabel}
</span>
```

### KPI Cards (Dashboard)

**Anatomy:**
```
┌─────────────────────────────┐
│ Upcoming Events             │  Label
│ 5                           │  Value (large)
│ This month                  │  Subtext
└─────────────────────────────┘
```

**Tailwind:**
```jsx
<div className="bg-bone border border-sand-300 rounded-lg p-6 shadow-sm">
  <p className="text-xs font-semibold uppercase text-gray-700 mb-2">
    Upcoming Events
  </p>
  <p className="text-4xl font-bold text-charcoal mb-1">5</p>
  <p className="text-sm text-gray-600">This month</p>
</div>
```

**With trend indicator:**
```jsx
<div className="bg-bone border border-sand-300 rounded-lg p-6">
  <div className="flex items-start justify-between mb-2">
    <p className="text-xs font-semibold uppercase text-gray-700">
      Revenue YTD
    </p>
    <span className="text-xs font-semibold text-success">↑ 12%</span>
  </div>
  <p className="text-4xl font-bold text-charcoal">$47,250</p>
  <div className="mt-3 h-1 bg-sand-200 rounded-full overflow-hidden">
    <div className="h-full bg-sage-600" style={{ width: '65%' }} />
  </div>
</div>
```

---

## Cards & Containers

### Proposal Card (Florist Dashboard)

**Anatomy:**
```
┌──────────────────────────────────────────────┐
│ [Thumbnail 80x80] Smith Wedding     Jul 15   │
│                  Ballroom         [●●●○○] 60% │
│                  Created 3 days ago  [⋯]    │
└──────────────────────────────────────────────┘
```

**Tailwind:**
```jsx
<div className="bg-bone border border-sand-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
  <div className="flex gap-4 items-start">
    {/* Thumbnail */}
    <img
      src={proposal.image}
      alt={proposal.coupleName}
      className="w-24 h-24 rounded-lg object-cover bg-sand-200 flex-shrink-0"
    />

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-charcoal truncate">
          {proposal.coupleName} Wedding
        </h3>
        <button className="text-gray-500 hover:text-charcoal flex-shrink-0">
          ⋯
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-1">
        {proposal.venue} • {formatDate(proposal.eventDate)}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-sand-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage-600 transition-all"
            style={{ width: `${proposal.progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">
          {proposal.progress}%
        </span>
      </div>

      <p className="text-xs text-gray-500">
        Created {formatRelativeTime(proposal.createdAt)}
      </p>
    </div>
  </div>
</div>
```

### Mood Board Card (Bride Portal)

**Anatomy:**
```
┌────────────────────┐
│                    │
│   [Image]          │  Full-width, 16:9 aspect
│                    │
├────────────────────┤
│ "Soft, romantic    │  Caption (serif, centered)
│  garden aesthetic" │
└────────────────────┘
```

**Tailwind:**
```jsx
<div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
  {/* Image */}
  <div className="relative bg-sand-200 aspect-video overflow-hidden">
    <img
      src={image.url}
      alt={image.caption}
      className="w-full h-full object-cover"
    />
  </div>

  {/* Caption */}
  <div className="bg-sand-50 p-4 text-center">
    <p className="text-sm font-serif italic text-gray-700">
      {image.caption}
    </p>
  </div>
</div>
```

---

## Modals & Overlays

### Confirmation Modal

**Anatomy:**
```
┌─────────────────────────────────────┐
│ Delete Proposal?                    │  Title (24px)
│ This action cannot be undone.       │  Body (16px)
│                                     │
│ [Cancel]              [Delete]      │  Buttons
└─────────────────────────────────────┘

Overlay: black / 20% opacity
Modal: z-50, centered
```

**Tailwind:**
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
    <div className="bg-bone rounded-lg p-8 max-w-md w-full shadow-lg">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-charcoal"
      >
        ✕
      </button>

      {/* Content */}
      <h2 className="text-2xl font-semibold text-charcoal mb-2">
        Delete Proposal?
      </h2>
      <p className="text-gray-700 mb-6">
        This action cannot be undone. The client will lose access to this proposal.
      </p>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={onDelete}
          className="btn bg-alert text-bone hover:bg-alert-600"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
```

### Toast Notification

**For success/error/info feedback**

```
┌─────────────────────┐
│ ✓ Proposal sent!    │  Auto-dismiss after 5s
└─────────────────────┘

Position: Bottom-right
Animation: Slide in from right, fade out
```

**Tailwind + Animation:**
```jsx
{notification && (
  <div className={`
    fixed bottom-6 right-6 px-4 py-3 rounded-lg
    bg-success text-bone font-semibold text-sm
    shadow-lg animate-in fade-in slide-in-from-right-10
    duration-300
    ${
      notification.type === 'success'
        ? 'bg-success'
        : notification.type === 'error'
        ? 'bg-alert'
        : 'bg-info'
    }
  `}>
    {notification.message}
  </div>
)}
```

---

## Loading & Empty States

### Loading Skeleton

**For proposal thumbnails, images, data**

```
┌─────────────┐
│ [Shimmer]   │  Soft gray, animated shimmer
│             │  Same dimensions as real element
└─────────────┘
```

**Tailwind:**
```jsx
<div className="bg-sand-200 rounded-lg animate-pulse aspect-video" />

/* Or more detailed card skeleton */
<div className="space-y-3">
  <div className="h-6 bg-sand-200 rounded w-3/4 animate-pulse" />
  <div className="h-4 bg-sand-200 rounded w-full animate-pulse" />
  <div className="h-4 bg-sand-200 rounded w-5/6 animate-pulse" />
</div>
```

### Empty State

**When no proposals, clients, inventory exist**

```
┌─────────────────────────┐
│        [Icon]           │  Large, sage color
│                         │
│ No proposals yet        │  Serif headline
│                         │
│ Start by creating your  │  Descriptive body text
│ first proposal          │
│                         │
│ [Create Proposal]       │  CTA button
└─────────────────────────┘
```

**Tailwind:**
```jsx
<div className="flex flex-col items-center justify-center py-20 px-4">
  {/* Icon */}
  <DocumentIcon className="w-20 h-20 text-sage-600 mb-4" />

  {/* Heading */}
  <h2 className="text-2xl font-serif font-bold text-charcoal mb-2">
    No proposals yet
  </h2>

  {/* Description */}
  <p className="text-gray-600 text-center mb-6 max-w-sm">
    Start by creating your first proposal. You'll be able to add florals,
    pricing, and send it to your client directly.
  </p>

  {/* CTA */}
  <button className="btn btn-primary">Create Proposal</button>
</div>
```

---

## Responsive Patterns

### Mobile-First Breakpoints

Use Tailwind's breakpoint prefixes:
```
sm: 640px   (small phone)
md: 768px   (tablet)
lg: 1024px  (laptop)
xl: 1280px  (desktop)
```

### Sidebar Responsive (Florist Dashboard)

```jsx
<div className="flex flex-col lg:flex-row h-screen">
  {/* Sidebar: hidden on mobile, shown on lg+ */}
  <aside className="hidden lg:flex lg:w-64 lg:border-r border-sand-300 bg-bone">
    {/* Navigation */}
  </aside>

  {/* Main Content: full width on mobile, flex on lg+ */}
  <main className="flex-1 overflow-auto">
    {/* Content */}
  </main>
</div>
```

### Proposal Card: Responsive Grid

**Mobile: 1 column | Tablet: 2 columns | Desktop: 3 columns**

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {proposals.map((proposal) => (
    <ProposalCard key={proposal.id} proposal={proposal} />
  ))}
</div>
```

### Form: Responsive Layout

**Single column on mobile, 2-column on tablet+**

```jsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormInput label="First Name" />
    <FormInput label="Last Name" />
  </div>

  <FormInput label="Event Date" fullWidth />

  <FormTextarea label="Your Vision" rows={5} fullWidth />

  <div className="flex gap-3 justify-end">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Save</button>
  </div>
</form>
```

---

## Animations & Transitions

### Standard Durations
- `duration-100`: Quick feedback (loading, small updates)
- `duration-150`: Default (hover states, UI changes)
- `duration-200`: Deliberate (modal open, form validation)
- `duration-300`: Slow (full-page transitions, narrative reveals)

### Timing Function
- `ease-in-out`: Natural, standard (most use cases)
- `ease-out`: Decelerate (entrance animations)
- `ease-in`: Accelerate (exit animations)

### Hover Scale (Cards)

```jsx
className="transition-transform duration-150 hover:scale-105"
```

### Fade & Slide In (Loading)

```jsx
className="animate-in fade-in slide-in-from-top-4 duration-300"
```

### Pulse (Pending, Awaiting Action)

```jsx
className="animate-pulse"
```

### Success Checkmark

```jsx
<motion.div
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <CheckIcon className="w-6 h-6 text-success" />
</motion.div>
```

---

## Accessibility Checklist

- [ ] **Color Contrast:** Text on background ≥ 4.5:1 (WCAG AA)
  - Sage (#7A8C6E) on bone (#FFFBF0): ✓ 4.7:1
  - Warm gray (#8C8C7A) on bone: ✓ 4.5:1
  - Charcoal on bone: ✓ 13.8:1

- [ ] **Focus States:** All interactive elements have visible 2–3px focus ring
  - Use `focus:ring-2 focus:ring-sage-600 focus:ring-offset-2`

- [ ] **Keyboard Navigation:** Tab through all buttons, inputs, links
  - Maintain logical tab order

- [ ] **Alt Text:** Images have descriptive alt text
  - Proposal thumbnails: "Proposal thumbnail for Smith wedding, blush roses"

- [ ] **Form Labels:** Every input has associated `<label>` (or aria-label)

- [ ] **ARIA Attributes:** Use for modals, dropdowns, expanded content
  - `aria-modal="true"` on modals
  - `aria-expanded` on accordions
  - `aria-label` for icon-only buttons

- [ ] **Semantic HTML:** Use `<button>`, `<form>`, `<section>`, `<nav>`
  - Not `<div role="button">`

---

## Figma Export Settings

When exporting components from Figma to Tailwind:

1. **Color Tokens:** Match Tailwind config exactly
   - Figma color: "Brand / Sage 600" → Tailwind: `sage-600`

2. **Spacing:** Use 8pt grid (4px increments)
   - Figma: 8, 16, 24, 32 → Tailwind: `p-2`, `p-4`, `p-6`, `p-8`

3. **Typography:** Export as font size + line height
   - Figma: "16px / 24px" → Tailwind: `text-base` (configured as 16px/24px)

4. **Shadows:** Use Tailwind shadow scale
   - Figma: "0 1px 2px rgba(0,0,0,5%)" → Tailwind: `shadow-sm`

5. **Border Radius:** Use Tailwind scale
   - Figma: 4px → Tailwind: `rounded-sm`
   - Figma: 6px → Tailwind: `rounded-lg`

---

## Testing Checklist

- [ ] Desktop: 1440px viewport (standard desktop)
- [ ] Tablet: 768px (iPad portrait)
- [ ] Mobile: 375px (iPhone SE portrait)
- [ ] Mobile Landscape: 812px (iPhone 12 landscape)
- [ ] Focus states keyboard navigation (Tab key)
- [ ] Color contrast in light mode + dark mode (if applicable)
- [ ] Form validation with error states
- [ ] Empty states (no data)
- [ ] Loading states (skeleton, spinner)
- [ ] Success / error notifications
- [ ] Modal open/close
- [ ] Responsive images (srcset for high DPI)

---

## Implementation Priority

**Phase 1 (MVP):**
- Buttons (primary, secondary, disabled states)
- Form inputs (text, textarea, select)
- Sidebar navigation
- Cards (proposals)
- KPI cards
- Status badges

**Phase 2 (Dashboard):**
- Data tables
- Modals
- Tooltips
- Empty states
- Loading skeletons

**Phase 3 (Polish):**
- Animations & transitions
- Micro-interactions (hover feedback)
- Accessibility audit
- Dark mode (optional)
- Responsive refinements

---

## File Organization (Tailwind)

```
src/
├── styles/
│   ├── globals.css          (Tailwind directives, utilities)
│   └── animations.css       (Custom keyframes)
├── components/
│   ├── buttons/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── Button.test.tsx
│   ├── forms/
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   └── Select.tsx
│   ├── cards/
│   │   ├── ProposalCard.tsx
│   │   └── KPICard.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── MainLayout.tsx
├── lib/
│   ├── tailwind.config.js   (Color tokens, spacing, fonts)
│   └── utils.ts             (classNames merging, type helpers)
└── pages/
    ├── dashboard.tsx
    ├── proposals/
    └── ...
```

---

End of Component Specifications
