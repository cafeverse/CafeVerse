# Commit Message Instructions

To ensure our automated CI/CD pipeline parses and categorizes your contributions perfectly on the **GitHub Releases** page, please format all commit messages according to the rules below.

---

## 🚀 Commit Message Format

Commit messages should be structured using a prefix indicating the change type, an optional scope, and a descriptive message:

```
<prefix>(<optional-scope>): <description>
```

### Example:

- `feat(router): migrate router core to generateRoutes`
- `fix(layout): resolve sidebar layout shifts`
- `chore(deps): upgrade react-router-dom`

---

## 🏷️ Parser Categories & Prefixes

Our dynamic CI/CD release notes engine reads your git commits since the last tag and groups them automatically into specific release sections based on these prefixes:

| Category                    | Allowed Prefixes                                           | Description / Examples                                                                                   |
| :-------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **✨ New**                  | `feat:`, `new:`                                            | Added new features or pages.<br>`feat(tv): integrate search recommendations`                             |
| **🐛 Bug Fixed**            | `fix:`                                                     | Resolved bugs, layout issues, or typescript crashes.<br>`fix(player): repair fullscreen window controls` |
| **🔧 Update & Improvement** | `refactor:`, `chore:`, `style:`, `perf:`, `docs:`, `test:` | Cleanups, optimization, build tweaks, styles.<br>`refactor(theme): convert components to modern HSL`     |

---

## 🚫 Skipping Release Cycles

If you are pushing a change that should **not** trigger a CI/CD build run or should be ignored by the release generator (e.g. minor documentation tweaks), simply append `[skip ci]` to the commit message:

```bash
git commit -m "docs: update readme with API keys [skip ci]"
```

---

_Standardized commit syntax guarantees perfect, professional, and zero-effort release notes generated directly from your history!_
