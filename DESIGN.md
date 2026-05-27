---
name: CaféVerse
description: A premium, fast, and cinematic desktop movie library.
colors:
  primary: '#ebd29f'
  primary-foreground: '#2e3335'
  secondary: '#4d4a43'
  secondary-foreground: '#ebd29f'
  background: '#232323'
  foreground: '#f2f2f2'
  card: '#2e2e2e'
  card-foreground: '#f2f2f2'
  popover: '#2e2e2e'
  popover-foreground: '#f2f2f2'
  muted: '#383838'
  muted-foreground: '#c4c4c4'
  accent: '#404040'
  accent-foreground: '#f2f2f2'
  destructive: '#c63f35'
  destructive-foreground: '#ffffff'
  border: '#3c3a36'
  input: '#5c5c5c'
  ring: '#ebd29f'
typography:
  display:
    fontFamily: 'var(--font-sans)'
    fontSize: 'clamp(2.5rem, 7vw, 4.5rem)'
    fontWeight: 900
    lineHeight: 1
    letterSpacing: 'tight'
  body:
    fontFamily: 'var(--font-sans)'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 'calc(var(--radius) - 4px)'
  md: 'calc(var(--radius) - 2px)'
  lg: 'var(--radius)'
  xl: 'calc(var(--radius) + 4px)'
spacing:
  sm: '8px'
  md: '16px'
  lg: '24px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  button-secondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.secondary-foreground}'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  card-container:
    backgroundColor: '{colors.card}'
    rounded: '{rounded.xl}'
    padding: '24px'
---

# Design System: CaféVerse

## 1. Overview

\*\*Creative North Star: "The Obsidian Theater"\*\*

CaféVerse is a premium, high-performance desktop movie and TV show catalog workspace. Built on the core principle of "The Obsidian Theater," the design treats the UI as a subtle, darkened auditorium. UI panels, controls, and borders melt gracefully into the shadows, ensuring that vibrant media cover posters and movie backdrops stand as the sole glowing hero on the screen.

The layout emphasizes content-first minimalism. Rather than trapping information in rigid card grids, the workspace leverages natural vertical flows, generous spacing rhythm, and borderless canvas integration.

**Key Characteristics:**

- **Obsidian Dimmed Canvas**: Immersive, flat-dark surfaces with extremely subtle light offsets.
- **Warm Sand Accents**: Soft, golden-amber primary highlights that represent a single, elegant source of active color.
- **Zero Motion Overhead**: Instant, direct responses with absolute 0-animation overhead to support user speed and reduced-motion preferences.
- **Content is Hero**: High-contrast, elegant typography combined with borderless media presentation.

## 2. Colors

CaféVerse operates on a committed color strategy where a primary, warm sand accent is used selectively against deep, dark neutrals. Bright neon borders and flat SaaS colors are strictly forbidden.

### Primary

- **Warm Sand Platinum** (`#ebd29f` / `oklch(0.9247 0.0524 66.1732)`): Used exclusively for active highlights, focus states, and high-importance CTA texts.

### Neutral

- **Obsidian Velvet** (`#232323` / `oklch(0.1776 0 0)`): The dark, flat-neutral background color of the workspace canvas.
- **Sleek Charcoal** (`#2e2e2e` / `oklch(0.2134 0 0)`): The secondary surface color used for popovers, panels, and sidebars.
- **Golden Obsidian Border** (`#3c3a36` / `oklch(0.2351 0.0115 91.7467)`): The highly restrained, warm-toned divider color.

### Named Rules

**The Content-First Ratio.** Warm sand primary color must occupy ≤10% of any given screen area. The absolute dark obsidian background must carry the remaining weight to preserve cinematic night legibility.

## 3. Typography

**Display Font:** `var(--font-sans)` (Inter or system sans fallbacks)
**Body Font:** `var(--font-sans)` (System sans)

**Character:** Bold, highly structured headlines with wide-open tracking contrasted against highly legible, clean sans body text for effortless reading in dim lighting.

### Hierarchy

- **Display** (Font Weight: 900, Size: `clamp(2.5rem, 7vw, 4.5rem)`, Line Height: 1): Used for main movie titles and giant header showcases.
- **Headline** (Font Weight: 800, Size: 1.875rem, Line Height: 1.25): Category headers and primary navigation markers.
- **Title** (Font Weight: 700, Size: 1.25rem, Line Height: 1.4): Content titles and section descriptions.
- **Body** (Font Weight: 400, Size: 1rem, Line Height: 1.5, Max Line Length: 75ch): General description and movie synopsis text.
- **Label** (Font Weight: 600, Size: 0.75rem, Case: uppercase): Meta badges and technical info row.

## 4. Elevation

CaféVerse is a flat-by-default, flat-obsidian system. Rather than floating cards with soft drop shadows, the app achieves clean, quiet structure using background tonal changes.

### Named Rules

**The Flat Obsidian Doctrine.** Shadows are forbidden. Depth is achieved entirely through background contrast (such as nesting a slightly lighter `#2e2e2e` surface inside a `#232323` background) or border-tint overlays rather than blurred drop shadows.

## 5. Components

All components are designed with an integrated, borderless feel that feels quiet and highly responsive.

### Buttons

- **Shape:** Softly curved corners (8px radius)
- **Primary:** High-contrast Warm Sand background with dark text (`#ebd29f` with `#2e3335` text).
- **Secondary / Ghost:** Subtle warm charcoal outline or translucent backdrop.

### Cards / Containers

- **Corner Style:** Extra large rounded corners (16px / `var(--radius-xl)`).
- **Background:** Quiet charcoal (`#2e2e2e`).
- **Shadow Strategy:** Zero shadows. Surfaces merge cleanly with the flat canvas.
- **Border:** Extremely thin border or borderless.

### Inputs / Fields

- **Style:** Flat dark background with a very thin stroke.
- **Focus:** Flat solid focus ring of `#ebd29f` with 0px blur.

### Navigation

- **Style:** Semi-transparent, glassmorphic obsidian sidebar that lists links cleanly. Hover state highlights the text with no heavy neon bounding boxes.

## 6. Do's and Don'ts

### Do:

- **Do** let the cinematic poster art carry the visual excitement of the page.
- **Do** keep components flat and borderless, relying on tone-on-tone layouts.
- **Do** respect the `0-animation` standard, ensuring immediate state toggles with no layout shifts.
- **Do** tint all dividers and borders with the warm sand hue (`#3c3a36`) to match the color strategy.

### Don't:

- **Don't** use SaaS cliché card grids with identical card sizes and heavy borders.
- **Don't** use bright neon or overly saturated colors for interactive borders or accents.
- **Don't** introduce generic or flat, boring list tables.
- **Don't** use standard box shadows to floatingly separate UI panels.
