# Agent Rules & Guidelines

## Styling and CSS Rules

- **No Hardcoded Hex Colors**: Avoid using hardcoded/custom hex colors (e.g. `#3c3a36`, `#2e2e2e`, `#232323`) directly in Tailwind utility classes inside files.
- **Use Theme Tokens**: Always use the CSS / Tailwind CSS theme tokens configured in `src/renderer/src/assets/main.css` (e.g. `bg-muted`, `border-border`, `bg-card`, etc.) to ensure complete consistency, responsive fidelity, and support for light/dark modes.

## TypeScript Types Rules

- **Single Source of Truth**: All shared TypeScript types and interfaces **must** live in `src/renderer/src/types/index.ts`. Never define reusable types inline inside component or context files.
- **Always Import from `@/types`**: Use the `@/types` path alias for all type imports across `.tsx` and `.ts` files (e.g. `import type { MediaItem, User } from '@/types'`).
- **Extend, Don't Duplicate**: Before defining a new interface, check `types/index.ts` first. If a matching or close shape already exists, extend or reuse it rather than creating a duplicate.
- **Type-only Imports**: Prefer `import type { ... }` for types that are not used as runtime values. This keeps bundles lean and intent clear.
- **Naming Conventions**:
  - Interfaces use `PascalCase` (e.g. `MediaItem`, `AppContextType`).
  - Do **not** prefix interfaces with `I` (e.g. avoid `IMediaItem`).
- **Grouped Sections**: Keep `types/index.ts` organized by domain with section comments:
  - `// Media types`
  - `// API utility types`
  - `// Auth types`
  - `// App-wide context types`

