# Agent Rules & Guidelines

## Styling and CSS Rules

- **No Hardcoded Hex Colors**: Avoid using hardcoded/custom hex colors (e.g. `#3c3a36`, `#2e2e2e`, `#232323`) directly in Tailwind utility classes inside files.
- **Use Theme Tokens**: Always use the CSS / Tailwind CSS theme tokens configured in `src/renderer/src/assets/main.css` (e.g. `bg-muted`, `border-border`, `bg-card`, etc.) to ensure complete consistency, responsive fidelity, and support for light/dark modes.
