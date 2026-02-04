# Design Principles

This document defines the visual design system for the Todo app. All UI implementation should follow these principles.

## Philosophy

**Linear-inspired minimalism**: The interface should feel like a professional tool, not a colorful consumer app. Every pixel earns its place. Content takes precedence over chrome.

Core tenets:

- **Invisible UI**: The interface fades into the background; tasks are the focus
- **Keyboard-first**: Every action accessible without a mouse
- **Information density**: Maximize visible content without sacrificing clarity
- **Restrained motion**: Transitions serve function, not decoration

## Visual Direction

### Aesthetic

- Minimal, clean, monochrome
- Sharp geometry over soft shapes
- Content-focused with subtle structural elements
- Professional tool feel, not playful app

### Density

- Compact layout prioritizing information density
- Tight but readable spacing
- Maximize tasks visible without scrolling
- Efficient use of screen real estate

## Spacing

Use a 4px base unit. Standard spacing values:

| Token | Value | Usage |
|-------|-------|-------|
| `1`   | 4px   | Tight gaps, icon padding |
| `2`   | 8px   | Default element spacing |
| `3`   | 12px  | Component internal padding |
| `4`   | 16px  | Section spacing |
| `6`   | 24px  | Major section gaps |
| `8`   | 32px  | Page-level spacing |

Prefer smaller values. When in doubt, use less space.

## Corner Radius

Sharp corners (0-2px) throughout:

| Element | Radius |
|---------|--------|
| Buttons | `rounded` (4px) |
| Inputs | `rounded` (4px) |
| Cards/Panels | `rounded` (4px) |
| Modals | `rounded-md` (6px) |
| Avatars | `rounded-full` |
| Tags/Badges | `rounded` (4px) |

Exception: Fully rounded for avatars and specific UI elements like toggle switches.

## Borders

Hairline (1px) borders for structural definition:

- Use `border-border` for all dividers
- Borders preferred over shadows for element separation
- Horizontal dividers between list items
- Vertical dividers between major sections (sidebar/content)

```
border border-border  // Standard border
border-b border-border  // Bottom divider
```

## Shadows

Minimal shadows, used sparingly:

| Element | Shadow |
|---------|--------|
| Dropdowns | `shadow-sm` |
| Modals | `shadow-md` |
| Tooltips | `shadow-sm` |
| Cards | None (use borders) |
| Buttons | None |

Shadows indicate elevation hierarchy only. Most elements use borders instead.

## Motion & Transitions

Quick transitions (100-150ms) for responsive feel:

| Property | Duration | Easing |
|----------|----------|--------|
| Color changes | 100ms | ease-out |
| Opacity | 100ms | ease-out |
| Transform | 150ms | ease-out |
| Layout shifts | 150ms | ease-out |

```
transition-colors  // Color-only transitions
duration-100  // Standard timing
```

Guidelines:

- No decorative animations
- Transitions should feel instant but smooth
- Avoid scale transforms except for micro-feedback
- Reduce motion for users who prefer it

## Interaction States

### Hover

Subtle background change only:

```
hover:bg-surface  // Light background on hover
hover:text-primary  // Strengthen text color
```

No scale changes. No shadow additions.

### Active/Pressed

Slight darkening or opacity reduction:

```
active:opacity-90
```

### Focus

Visible outline for keyboard navigation:

```
focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
```

Focus rings appear only for keyboard navigation (`:focus-visible`), not mouse clicks.

### Disabled

Reduced opacity, no pointer events:

```
disabled:opacity-50 disabled:cursor-not-allowed
```

## Buttons

Ghost style by default (text only, no background):

### Primary Actions

```
text-primary hover:bg-surface rounded px-3 py-1.5 font-medium transition-colors
```

### Secondary Actions

```
text-secondary hover:text-primary hover:bg-surface rounded px-3 py-1.5 transition-colors
```

### Destructive Actions

```
text-urgent hover:bg-urgent/10 rounded px-3 py-1.5 transition-colors
```

### Icon Buttons

```
text-secondary hover:text-primary hover:bg-surface rounded p-1.5 transition-colors
```

Reserve filled buttons for critical CTAs (e.g., "Create Project" in empty states).

## Icons

Outline/stroke style throughout:

- Stroke width: 1.5px
- Size: 16px (`h-4 w-4`) for inline, 20px (`h-5 w-5`) for navigation
- Color: `text-secondary`, `text-primary` on hover/active
- Source: Heroicons (outline variant)

```tsx
<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
```

## Typography

### Hierarchy

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Page title | `text-lg` | `font-semibold` | Main headings |
| Section title | `text-sm` | `font-medium` | Sidebar sections, group labels |
| Body | `text-sm` | `font-normal` | Task titles, content |
| Caption | `text-xs` | `font-normal` | Metadata, timestamps |

### Colors

- Primary text: `text-primary` — Main content
- Secondary text: `text-secondary` — Supporting info, placeholders
- Accent text: `text-accent` — Links, interactive elements

## Component Patterns

### List Items

```
flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface rounded transition-colors
```

Active state:

```
bg-surface text-primary
```

### Input Fields

Borderless until focused:

```
bg-transparent text-primary placeholder:text-secondary
focus:outline-none focus-visible:ring-1 focus-visible:ring-border
```

### Modals

- Centered, fixed positioning
- Subtle backdrop (`bg-primary/20`)
- `rounded-md` corners
- `shadow-md` for elevation
- Border for definition

### Dropdowns

- Positioned below trigger
- `shadow-sm` with border
- Items use list item pattern
- Close on outside click and Escape

### Empty States

- Centered content
- Secondary text color
- Single CTA button (can be filled)
- Optional subtle icon

## Color Usage

Colors defined in `src/index.css`. Reference by semantic name:

| Name | Purpose |
|------|---------|
| `background` | Page background |
| `surface` | Elevated surfaces, hover states |
| `border` | All borders and dividers |
| `primary` | Main text, strong emphasis |
| `secondary` | Supporting text, icons |
| `accent` | Interactive elements, links |
| `urgent` | Priority indicator |
| `high` | Priority indicator |
| `medium` | Priority indicator |
| `low` | Priority indicator |

Never use raw hex values. Always use semantic tokens.

## Accessibility

- Minimum 4.5:1 contrast ratio for text
- Visible focus indicators (`:focus-visible`)
- Touch targets minimum 44x44px on mobile
- Reduced motion support via `prefers-reduced-motion`
- Semantic HTML elements
- ARIA labels for icon-only buttons

## Do's and Don'ts

### Do

- Use semantic color tokens
- Keep interactions subtle
- Prioritize keyboard navigation
- Test in both light and dark modes
- Use consistent spacing scale

### Don't

- Add decorative animations
- Use shadows for flat elements
- Create custom colors outside the palette
- Use inline styles
- Add rounded corners beyond the spec
- Scale elements on hover
