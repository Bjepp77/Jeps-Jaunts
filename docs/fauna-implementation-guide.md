# Fauna Implementation Guide
## From Design Brief to Production-Ready Code

**Purpose:** Actionable checklist and developer guide for implementing the Fauna design system
**Audience:** Frontend engineers, design system builders
**Status:** April 2026

---

## Design System Philosophy

Fauna's design system is built on these principles:

1. **Dual Personality, Single Palette** – Florist dashboard feels professional and tool-like; bride portal feels editorial and elevated. Both use the same earthy color palette.

2. **Information + Beauty** – Florists need complete data; brides need narrative. Layout and typography switch personalities without changing colors.

3. **Constraint as Clarity** – 8pt grid spacing, limited color choices, and deliberate animation timing prevent bloat and ensure consistency.

4. **Mobile-First, Field-Ready** – Florists use Fauna in the cooler, at consultations, during setup. Every experience must work on mobile without sacrificing information access.

---

## Part 1: Setup & Configuration

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{mdx,md}',
  ],

  theme: {
    // Override defaults
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',

      // Brand palette (earthy, warm)
      sand: {
        50:  '#F9F8F5',  // very light background
        100: '#F2EFE8',  // light background, hover states
        200: '#E8E0D0',  // PRIMARY background (from CLAUDE.md)
        300: '#DDD4C4',  // borders
        400: '#D4CCBC',  // subtle UI
      },
      sage: {
        50:  '#F1F3EF',  // very light, barely perceptible
        100: '#D4E5CC',  // light, for hover
        200: '#B0D9A6',  // medium (less common)
        600: '#7A8C6E',  // PRIMARY action color (from CLAUDE.md)
        700: '#6A7C5E',  // hover state
        800: '#5A6C4E',  // active state
        900: '#4A5C3E',  // dark, for deep states
      },
      clay: {
        100: '#E8DFD0',  // light, background
        600: '#B8926A',  // PRIMARY secondary color (from CLAUDE.md)
        700: '#A8825A',  // hover
        800: '#8C7654',  // darker
      },
      gray: {
        400: '#CDCDC0',  // disabled, muted UI
        500: '#AEAEA6',  // secondary text
        600: '#8C8C7A',  // warm gray for UI labels (from CLAUDE.md)
        700: '#6D6D65',  // darker gray text
        800: '#4A4A42',  // secondary headings
      },
      charcoal: {
        900: '#2C2C20',  // PRIMARY text color (from CLAUDE.md)
      },
      bone: '#FFFBF0',  // PRIMARY background (from CLAUDE.md)

      // Semantic colors
      success: '#9CBE3C',   // green for approvals
      alert:   '#D97F3F',   // orange/red for warnings
      info:    '#3B7A8E',   // blue for informational

      // Grays for extended use
      'black-true': '#000000',
    },

    spacing: {
      px: '1px',
      0:  '0',
      1:  '4px',   // xs gap
      2:  '8px',   // sm gap
      3:  '12px',  // md gap
      4:  '16px',  // lg gap
      5:  '20px',  // xl gap
      6:  '24px',  // 2xl gap
      8:  '32px',  // 3xl gap
      10: '40px',  // 4xl gap
      12: '48px',  // 5xl gap
      14: '56px',  // 6xl gap
      16: '64px',  // 7xl gap
      20: '80px',  // hero spacing
      24: '96px',  // large spacing
    },

    fontFamily: {
      // Serif for bride portal, emotional moments
      serif: [
        'Crimson Pro',
        'Cardo',
        'Georgia',
        'serif',
      ],

      // Sans for dashboard, clarity
      sans: [
        'Inter',
        'Source Sans Pro',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ],

      // Monospace for code, stem counts
      mono: [
        'IBM Plex Mono',
        'JetBrains Mono',
        'Courier New',
        'monospace',
      ],
    },

    fontSize: {
      // Florist dashboard scale (sans-serif optimized)
      xs:   ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      sm:   ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg:   ['18px', { lineHeight: '28px' }],
      xl:   ['24px', { lineHeight: '32px', fontWeight: '600' }],
      '2xl': ['32px', { lineHeight: '40px', fontWeight: '700' }],
      '3xl': ['40px', { lineHeight: '48px', fontWeight: '700' }],

      // Bride portal scale (serif-optimized)
      prose: ['18px', { lineHeight: '28px' }],
      'prose-lg': ['20px', { lineHeight: '32px' }],
      'prose-heading': ['48px', { lineHeight: '56px', fontWeight: '700' }],
    },

    fontWeight: {
      light:   300,
      normal:  400,
      medium:  500,
      semibold: 600,
      bold:    700,
      'extra-bold': 800,
    },

    letterSpacing: {
      tighter:  '-0.05em',
      tight:    '-0.025em',
      normal:   '0',
      wide:     '0.025em',
      wider:    '0.05em',
      widest:   '0.1em',
      // For luxury wedding typography
      uppercase: '0.15em',
    },

    lineHeight: {
      none:    '1',
      tight:   '1.25',
      snug:    '1.375',
      normal:  '1.5',
      relaxed: '1.625',
      loose:   '2',
    },

    shadow: {
      none:    'none',
      xs:      '0 1px 2px rgba(0, 0, 0, 0.05)',
      sm:      '0 1px 2px rgba(0, 0, 0, 0.05)',
      base:    '0 2px 4px rgba(0, 0, 0, 0.08)',
      md:      '0 2px 8px rgba(0, 0, 0, 0.08)',
      lg:      '0 10px 25px rgba(0, 0, 0, 0.1)',
      xl:      '0 20px 40px rgba(0, 0, 0, 0.15)',
      inner:   'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    borderRadius: {
      none:  '0',
      sm:    '4px',
      base:  '6px',
      md:    '8px',
      lg:    '12px',
      full:  '9999px',
    },

    borderWidth: {
      DEFAULT: '1px',
      0:       '0',
      2:       '2px',
      4:       '4px',
    },

    // Extended theme for premium feel
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

### Fonts: Google Fonts Setup

In your `globals.css` or layout head:

```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
```

Or in Tailwind config:

```javascript
fontFamily: {
  serif: [
    'Crimson Pro',
    { url: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700', format: 'truetype' },
    'serif',
  ],
}
```

---

## Part 2: Component Library Structure

### Recommended File Organization

```
src/
├── components/
│   ├── atoms/           # Smallest building blocks
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx    (Storybook for design review)
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Badge/
│   │   ├── Icon/
│   │   └── ...
│   │
│   ├── molecules/       # Combinations of atoms
│   │   ├── FormInput/   (Label + Input + Helper text)
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── ...
│   │
│   ├── organisms/       # Complex components
│   │   ├── Dashboard/
│   │   ├── ProposalBuilder/
│   │   ├── BridePortal/
│   │   └── ...
│   │
│   └── layout/          # Layout primitives
│       ├── MainLayout.tsx
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Footer.tsx
│
├── pages/               # Next.js pages or route files
│   ├── index.tsx
│   ├── dashboard/
│   ├── proposals/
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── useProposals.ts
│   ├── useMediaQuery.ts
│   └── ...
│
├── lib/
│   ├── colors.ts        # Type-safe color tokens
│   ├── typography.ts    # Font scale definitions
│   ├── spacing.ts       # Spacing constants
│   └── utils.ts         # classNames, formatting helpers
│
├── styles/
│   ├── globals.css      (Tailwind @import, global styles)
│   ├── animations.css
│   └── utilities.css
│
└── __tests__/           # Unit & integration tests
    ├── components/
    └── pages/
```

---

## Part 3: Building Core Components

### Example: Button Component

**File: `src/components/atoms/Button/Button.tsx`**

```typescript
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'font-semibold rounded-lg transition-all duration-150 ' +
      'flex items-center justify-center gap-2 ' +
      'disabled:opacity-60 disabled:cursor-not-allowed ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Variant styles
    const variantStyles = {
      primary:
        'bg-sage-600 text-bone ' +
        'hover:bg-sage-700 hover:shadow-md ' +
        'active:bg-sage-800 active:shadow-inner ' +
        'focus:ring-sage-600',
      secondary:
        'border-2 border-clay-600 text-clay-600 bg-transparent ' +
        'hover:bg-clay-600/10 ' +
        'active:bg-clay-600/15 ' +
        'focus:ring-clay-600/50',
      tertiary:
        'text-sage-600 bg-transparent ' +
        'hover:text-sage-800 ' +
        'active:text-sage-900 ' +
        'focus:ring-sage-600/30',
      ghost:
        'text-charcoal bg-transparent ' +
        'hover:bg-sand-100 ' +
        'active:bg-sand-200 ' +
        'focus:ring-sage-600/30',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    // Combine all styles
    const buttonClass = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      isLoading && 'opacity-80 cursor-wait',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClass}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && iconPosition === 'left' && !isLoading && icon}
        {children}
        {icon && iconPosition === 'right' && !isLoading && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

**File: `src/components/atoms/Button/Button.stories.tsx`** (Storybook)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Create Proposal',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Edit',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    isLoading: true,
    children: 'Sending...',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### Example: Form Input Component

**File: `src/components/molecules/FormInput/FormInput.tsx`**

```typescript
import React from 'react';

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, helperText, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-semibold uppercase text-gray-700 tracking-wide">
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 rounded-lg border
              font-sans text-base
              transition-colors duration-150
              placeholder:text-gray-400
              ${
                error
                  ? 'border-alert bg-bone text-charcoal focus:ring-alert/10'
                  : 'border-sand-300 bg-bone text-charcoal ' +
                    'focus:border-sage-600 focus:ring-2 focus:ring-sage-600/10 ' +
                    'focus:outline-none'
              }
              disabled:bg-sand-100 disabled:text-gray-500 disabled:cursor-not-allowed
              ${icon ? 'pl-10' : ''}
              ${className}
            `}
            {...props}
          />
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-alert font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-xs text-gray-600">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export default FormInput;
```

---

## Part 4: Design Tokens & Utilities

### File: `src/lib/colors.ts`

```typescript
// Type-safe color palette
export const colors = {
  // Brand
  sand: {
    50: '#F9F8F5',
    100: '#F2EFE8',
    200: '#E8E0D0',
    300: '#DDD4C4',
  },
  sage: {
    50: '#F1F3EF',
    600: '#7A8C6E',
    700: '#6A7C5E',
    800: '#5A6C4E',
  },
  clay: {
    100: '#E8DFD0',
    600: '#B8926A',
    700: '#A8825A',
  },
  gray: {
    400: '#CDCDC0',
    600: '#8C8C7A',
    700: '#6D6D65',
  },
  charcoal: '#2C2C20',
  bone: '#FFFBF0',

  // Semantic
  success: '#9CBE3C',
  alert: '#D97F3F',
  info: '#3B7A8E',
} as const;

// Export for use in CSS-in-JS
export type ColorToken = typeof colors;
export type ColorName = keyof ColorToken;
```

### File: `src/lib/typography.ts`

```typescript
// Typography scale constants
export const fontSizes = {
  xs: { size: '12px', lineHeight: '16px' },
  sm: { size: '14px', lineHeight: '20px' },
  base: { size: '16px', lineHeight: '24px' },
  lg: { size: '18px', lineHeight: '28px' },
  xl: { size: '24px', lineHeight: '32px' },
  '2xl': { size: '32px', lineHeight: '40px' },
  '3xl': { size: '48px', lineHeight: '56px' },
} as const;

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  'extra-bold': 800,
} as const;

export const fontFamilies = {
  serif: 'font-serif',
  sans: 'font-sans',
  mono: 'font-mono',
} as const;

// Typographic styles for common use cases
export const typographyStyles = {
  'headline-1': `
    font-serif font-bold
    text-3xl lg:text-4xl
    leading-tight
    text-charcoal
  `,
  'headline-2': `
    font-serif font-bold
    text-2xl
    leading-snug
    text-charcoal
  `,
  'body-lg': `
    font-sans font-normal
    text-lg
    leading-relaxed
    text-charcoal
  `,
  'body-base': `
    font-sans font-normal
    text-base
    leading-normal
    text-charcoal
  `,
  'label-sm': `
    font-sans font-semibold
    text-xs
    uppercase
    tracking-wide
    text-gray-700
  `,
} as const;
```

### File: `src/lib/utils.ts`

```typescript
// Utility for safely combining class names
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Format currency for proposal pricing
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Format date for proposals
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Calculate relative time (e.g., "3 days ago")
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date);
};
```

---

## Part 5: Page Templates

### Florist Dashboard Layout

**File: `src/components/layout/DashboardLayout.tsx`**

```typescript
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  actions,
}) => {
  return (
    <div className="flex h-screen bg-sand-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {title && (
          <Header>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-charcoal">
                {title}
              </h1>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </Header>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
```

### Bride Portal Page

**File: `src/pages/proposals/[id]/view.tsx`** (Next.js)

```typescript
import React from 'react';
import { useRouter } from 'next/router';
import ProposalView from '@/components/organisms/ProposalView';

export default function ViewProposal() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bone">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-bone border-b border-sand-300">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl text-charcoal">Fauna</h1>
          <button className="text-gray-600 hover:text-charcoal">Menu</button>
        </div>
      </header>

      {/* Proposal Content */}
      <ProposalView proposalId={id} />
    </div>
  );
}
```

---

## Part 6: Testing Strategy

### Component Testing Example

**File: `src/components/atoms/Button/Button.test.tsx`**

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies primary variant styles', () => {
    const { container } = render(
      <Button variant="primary">Primary</Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-sage-600', 'text-bone');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state with spinner', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveClass('opacity-80', 'cursor-wait');
  });

  it('has proper focus styles for keyboard navigation', () => {
    const { container } = render(<Button>Focus</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('focus:ring-2', 'focus:outline-none');
  });
});
```

---

## Part 7: Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

// Use Next.js Image component for optimization
<Image
  src={proposal.thumbnailUrl}
  alt={`${proposal.coupleName} wedding proposal`}
  width={400}
  height={300}
  placeholder="blur"
  quality={85}
  priority={false}
/>
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Load complex components only when needed
const ProposalBuilder = dynamic(
  () => import('@/components/organisms/ProposalBuilder'),
  { loading: () => <ProposalBuilderSkeleton /> }
);
```

### CSS Purging

Tailwind automatically purges unused styles. Ensure your config content paths are accurate:

```javascript
content: [
  './src/**/*.{js,ts,jsx,tsx}',
  './pages/**/*.{js,ts,jsx,tsx}',
],
```

---

## Part 8: Accessibility Compliance

### WCAG 2.1 AA Checklist

- [ ] **Color Contrast** – Text/background ≥ 4.5:1
  - Test with [Contrast Ratio](https://webaim.org/resources/contrastchecker/)
  - Sage on bone: 4.7:1 ✓
  - Charcoal on bone: 13.8:1 ✓

- [ ] **Focus States** – All interactive elements have visible focus
  ```css
  focus:ring-2 focus:ring-offset-2 focus:ring-sage-600
  ```

- [ ] **Keyboard Navigation** – Tab through all controls, logical order
  - Use `tabindex="0"` sparingly, only for custom controls

- [ ] **ARIA Labels** – Icons and unlabeled buttons have aria-label
  ```jsx
  <button aria-label="Delete proposal">🗑️</button>
  ```

- [ ] **Semantic HTML** – Use `<button>`, `<a>`, `<form>`, `<section>`
  - Not `<div role="button">`

- [ ] **Form Labels** – Every input has associated `<label>`
  ```jsx
  <label htmlFor="couple-name">Couple's Name</label>
  <input id="couple-name" type="text" />
  ```

- [ ] **Error Messages** – Clear, actionable, linked to form fields
  ```jsx
  <input aria-describedby="error-message" />
  <span id="error-message" className="text-alert">Email is required</span>
  ```

---

## Part 9: Deployment & Performance Metrics

### Build Optimization

```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze
```

### Key Metrics to Monitor

- **Largest Contentful Paint (LCP)** – Target: < 2.5s
- **First Input Delay (FID)** – Target: < 100ms
- **Cumulative Layout Shift (CLS)** – Target: < 0.1
- **Bundle Size** – Keep core dashboard JS < 150KB gzipped

### Monitoring Tools

- [Vercel Analytics](https://vercel.com/analytics) (if deploying on Vercel)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

---

## Part 10: Deployment Checklist

### Pre-Launch

- [ ] All components pass accessibility tests (axe DevTools)
- [ ] Responsive design tested on:
  - [ ] iPhone SE (375px)
  - [ ] iPad (768px)
  - [ ] Laptop (1440px)
- [ ] Forms validated with various input scenarios
- [ ] Empty states, loading states, error states present
- [ ] Performance metrics meet targets
- [ ] Analytics tracking configured
- [ ] Error logging set up (Sentry, etc.)
- [ ] Design handoff documentation complete

### Launch

- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Environment variables set (API keys, endpoints)
- [ ] Database migrations run
- [ ] Monitoring alerts configured
- [ ] User onboarding/tutorial ready
- [ ] Support documentation prepared

### Post-Launch

- [ ] Monitor error rates and performance
- [ ] Collect user feedback
- [ ] Iterate based on real usage patterns
- [ ] Schedule design review (weekly for first month)

---

## Final Notes

This implementation guide pairs with:
1. **fauna-design-brief.md** – Strategic design decisions, research-backed patterns
2. **fauna-component-specs.md** – Detailed component anatomy, states, accessibility

Together, they form a complete design-to-code system. Use this guide as a reference while building; return to the design brief when design decisions need justification.

---

**Questions?** Refer to:
- Design brief: rationale + research
- Component specs: anatomy + Tailwind code
- Implementation guide: setup + tooling

All three documents work together.
