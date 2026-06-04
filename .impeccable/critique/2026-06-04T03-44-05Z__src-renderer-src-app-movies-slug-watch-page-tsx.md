---
target: src/renderer/src/app/movies/[slug]/watch/page.tsx
total_score: 28
p0_count: 0
p1_count: 2
timestamp: 2026-06-04T03-44-05Z
slug: src-renderer-src-app-movies-slug-watch-page-tsx
---

# Design Critique: Movie Watch Page

## Heuristics Scoring Table

| #         | Heuristic                       | Score     | Key Issue                                                                                         |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3/4       | Loading pulse and buffering states are clear, but player load is reliant on iframe callback.      |
| 2         | Match System / Real World       | 4/4       | Good use of standard player icons and layout metaphors.                                           |
| 3         | User Control and Freedom        | 3/4       | Standard back navigation, but lacks escape-key listeners to easily exit the watch view.           |
| 4         | Consistency and Standards       | 2/4       | Violates the Flat Obsidian Doctrine by using drop shadows (`shadow-2xl`) and decorative blurs.    |
| 5         | Error Prevention                | 3/4       | Handles missing movie data gracefully, though could validate slug earlier.                        |
| 6         | Recognition Rather Than Recall  | 4/4       | Immediate visibility of title, poster, and storyline details.                                     |
| 7         | Flexibility and Efficiency      | 2/4       | No keyboard shortcuts for player control (e.g. Space, arrow keys, Esc).                           |
| 8         | Aesthetic and Minimalist Design | 2/4       | Overuse of card containers, shadows, and glassmorphic blurs contrary to content-first minimalism. |
| 9         | Error Recovery                  | 3/4       | Clean error page with recovery action ("Back to Movies").                                         |
| 10        | Help and Documentation          | 2/4       | Lacks basic controls help or shortcut guidance.                                                   |
| **Total** |                                 | **28/40** | **Fair / Needs Refinement**                                                                       |

## Anti-Patterns Verdict

**LLM Assessment**: The interface structure uses multiple nested containers and cards. Wrapping the media player, poster, metadata, and insights panel in separate rounded border containers (`bg-white/2`, `border-white/5`, `shadow-2xl`) gives a boxed, SaaS-like feel rather than a premium, borderless cinema canvas. It also introduces shadow and blur styles which are forbidden under CafeVerse's "Flat Obsidian Doctrine".

**Deterministic scan**: Scans unavailable (bundled detector not found).

**Visual overlays**: Overlay injection skipped (no active browser session / server connection).

## Overall Impression

The page is functional and does a great job organizing metadata and calculations. However, it feels too busy due to the card-heavy container design. Stripping away the shadows and borders to let the content breathe would align it much better with the "Obsidian Theater" creative direction.

## What's Working

- **Dynamic Calculations**: The "Finish Watching At" plex-style calculation and stream size metrics add a highly premium touch.
- **Backdrop Ambience**: The absolute positioned, low-opacity backdrop image (`opacity-15 blur-3xl`) adds a beautiful, immersive cinematic feel without distracting from the player.

## Priority Issues

### [P1] Violation of Flat Obsidian Doctrine

- **Why it matters**: The design system explicitly forbids box shadows (`shadow-2xl`) and decorative glassmorphism (`backdrop-blur-md`) to ensure components melt into the dark canvas.
- **Fix**: Remove all `shadow-2xl`, `backdrop-blur-md`, and `backdrop-blur-sm` classes. Use subtle background tonal changes (`bg-muted/10` or similar) to define structure instead.
- **Suggested command**: `impeccable layout`

### [P1] Over-Containerization & SaaS Cliché Layout

- **Why it matters**: Wrapping every section in card containers creates unnecessary visual noise and boxy separations.
- **Fix**: Make the media player borderless, merge the info card with the main description, and layout the dynamic insights directly on the dark canvas.
- **Suggested command**: `impeccable layout`

### [P2] Missing Keyboard Shortcuts & Controls

- **Why it matters**: Power users watching media expect shortcuts like `Space` for play/pause, `Esc` to go back, and `f` for fullscreen.
- **Fix**: Add a global keydown event listener inside `useEffect` to handle these player events.
- **Suggested command**: `impeccable harden`

## Persona Red Flags

**Alex (Power User)**: Expects keyboard controls. Lacks arrow key seeking or spacebar controls. Will feel frustrated navigating back to details via clicking a small button.

**Jordan (First-Timer)**: No guidance on how to change players or refresh streams. If the default player fails, they won't know how to recover.

## Minor Observations

- The title area uses `line-clamp-1` which might truncate long titles unnecessarily on large screens.
- Time display uses `toLocaleTimeString` without specifying 24-hour preference or locale settings cleanly, which could cause minor format drifts.

## Questions to Consider

- What if the player took up 100% width of the viewport on larger screens to mimic a real cinema theater?
- Can we unify the page metadata (runtime, year, genres) under the main title instead of separating it across cards?
