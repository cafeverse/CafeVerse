---
target: src/renderer/src/pages/movieDetail.tsx
total_score: 28
p0_count: 1
p1_count: 2
timestamp: 2026-05-26T03-35-37Z
slug: src-renderer-src-pages-moviedetail-tsx
---

# Design Critique: src/renderer/src/pages/movieDetail.tsx

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                       |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Solid loading skeleton state; download feedback is a basic alert.               |
| 2         | Match System / Real World       | 3.5       | Traditional movie navigation icons, badges, and layout expectations.            |
| 3         | User Control and Freedom        | 3         | Fluid back button navigation, but lacking quick close or keyboard controls.     |
| 4         | Consistency and Standards       | 2         | Styling deviates from flat obsidian theme; custom green and bounce animations.  |
| 5         | Error Prevention                | 3.5       | Fallback logic works well to catch invalid movie slugs and fetch catalog items. |
| 6         | Recognition Rather Than Recall  | 3         | Media list elements are clear, but title is visually duplicated.                |
| 7         | Flexibility and Efficiency      | 2         | Action items are strictly click-based; no keyboard shortcuts or shortcuts.      |
| 8         | Aesthetic and Minimalist Design | 2         | Heavy drop shadows, decorative blurs, and green colors clutter the space.       |
| 9         | Error Recovery                  | 3         | Solid full-screen error handler page with clear actions.                        |
| 10        | Help and Documentation          | 3         | Clean, contextual hover tooltips for primary actions.                           |
| **Total** |                                 | **28/40** | **[Fair / Degraded]**                                                           |

## Anti-Patterns Verdict

### LLM Assessment: AI Slop & Visual Mismatch

The screen contains several severe design and styling violations that compromise the brand's aesthetic:

- **Redundant Visual Clutter**: The movie title is printed twice in immediate vertical sequence (once inside the high-impact hero backdrop, and again in Column 2 right below it).
- **Glassmorphic & Shadow Overload**: Multiple elements are wrapped in nested transparent glass containers with `backdrop-blur-xl` and deep `shadow-2xl` elevation layers, directly breaking the **Flat Obsidian Doctrine** (forbidding shadows and restricting glassmorphic highlights).
- **Animation Deviations**: Standard transitions (`hover:scale-102`, `hover:-translate-y-2`, `animate-bounce` on icons) violate the **0-animation standard**.
- **Out-of-Brand Accent Colors**: The bright, generic green background (`#4CAF50`) on the primary Download button clashes with the warm sand theme and creates a cheap, templated look.

### Deterministic Scan

- **CLI detector**: `bundled detector not found` (Manual inspection carried out).
- **Visual overlays**: `skipped (browser automation unavailable in this session)`.

## Overall Impression

While the layout structure successfully groups crucial media metadata, cast lists, and storyline briefs, it is visually overstimulated. The implementation suffers from default design templates (standard green buttons, generic drop shadows, and unnecessary animations) rather than adhering to the cinematic, flat, 0-animation identity of CaféVerse.

## What's Working

1. **Cinematic Hero Framing**: The full-bleed background banner utilizes standard gradients to draw immediate visual focus and maintain excellent typography legibility.
2. **Contextual Help Affordances**: The watchlist toggle successfully utilizes Radix Tooltips to offer helpful, non-intrusive action instructions.
3. **Structured Cast Carousel**: The horizontal cast scrollarea presents rich profile badges cleanly in a unified, swipeable track.

## Priority Issues

### [P0] Redundant Title Duplication

- **Why it matters**: Displaying the title twice in immediate vertical sequence ruins typographic hierarchy and increases cognitive load.
- **Fix**: Remove the secondary title block from Column 2 (`h2` at line 273), and elevate the genres and IMDb ratings.
- **Suggested command**: `/impeccable polish` or `/impeccable layout`

### [P1] Animation & Transition Violations (0-Animation Rule)

- **Why it matters**: Directly violates the reduced motion and 0-animation principles established in the design system.
- **Fix**: Remove `animate-bounce` from the bookmark check icon, and replace all hover translation/scaling styles with instant background color changes.
- **Suggested command**: `/impeccable polish` or `/impeccable quieter`

### [P1] Hardcoded Green Button (Brand Color Deviation)

- **Why it matters**: Clashes with the custom warm sand palette (`--primary`) and introduces cheap, non-cohesive styling.
- **Fix**: Change the green Download button (`#4CAF50`) to utilize the `--primary` theme token, removing the custom shadows and transitions.
- **Suggested command**: `/impeccable colorize` or `/impeccable polish`

### [P2] Glassmorphism & Shadow Clutter

- **Why it matters**: Violates the **Flat Obsidian Doctrine** which forbids traditional box-shadow lists and limits glassmorphism in favor of flat panel tonality.
- **Fix**: Strip out backdrop-blur utilities (`backdrop-blur-xl`) and drop-shadow tokens (`shadow-2xl`, `shadow-lg`). Apply solid flat panels using `--card` or `--muted` background variables.
- **Suggested command**: `/impeccable distill` or `/impeccable polish`

## Persona Red Flags

### Jordan (First-Timer)

- **Action**: Navigating the movie details screen to decide whether to download or bookmark.
- **Red Flags**: The duplicate movie title and high-contrast green button distract from critical metadata. The bounce animations create an inconsistent, overstimulated visual path when browsing at night. Jordy faces visual fatigue due to excessive blurs and high-contrast glowing elements.

### Alex (Power User)

- **Action**: Toggling movies on their watchlist and managing catalogs quickly.
- **Red Flags**: Hover scaling translations and transition delays on similar lists and button states feel sluggish. The lack of standard keyboard shortcuts (e.g., pressing `D` to download, `W` to watchlist, or `Esc` to return) degrades power efficiency.

## Minor Observations

- Similar movies card overlays show on hover, but the 100ms fade transition feels unnecessary for a 0-animation system.
- IMDb rating badge uses a custom hardcoded background (`#f3ce13`) instead of the CSS theme token.

## Questions to Consider

- What if the Download CTA was styled as an elegant, flat button styled with the primary warm sand token, letting the green tone disappear entirely?
- How much cleaner would the details section feel if the redundant title block was removed, allowing metadata columns to align perfectly?
- Could we convey panel depth using simple background color contrasts (e.g., `#2e2e2e` against `#232323`) rather than heavy blurred drop shadows?
