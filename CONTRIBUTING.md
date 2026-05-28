# 🤝 Contributing to CaféVerse

Thank you for your interest in contributing to CaféVerse! We are thrilled to welcome your support in making the ultimate media client.

To maintain a clean, robust codebase and ensure our automated release cycles continue to function perfectly, please review and follow these guidelines when contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [💻 Local Development Workflow](#local-development-workflow)
- [⚠️ Commit Message Format](#commit-message-format)

---

## 😇 Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and collaborative environment. Please treat all contributors with kindness, empathy, and respect.

---

## 🙋 How Can I Contribute?

### Reporting Bugs

If you find a bug, please open a GitHub Issue and include:

- A clear, descriptive title.
- Steps to reproduce the behavior.
- Expected vs. actual results.
- Your operating system version.
- Any screenshots or log outputs if available.

### Suggesting Enhancements

If you have a feature idea or enhancement suggestion:

- Search existing issues to ensure it hasn't been proposed yet.
- Open a new issue describing the proposal, why it is useful, and how it should work.

### Pull Requests

Please follow these steps to submit your changes:

1. **Fork** the repository and clone it locally.
2. Create a new topic branch from the `main` branch:

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. Implement your changes, following our code standards.
4. Run static validation checks (see below) to ensure everything compiles.
5. Commit your changes following the [Commit Message Format](#commit-message-format).
6. Push to your fork and submit a **Pull Request** to the `main` branch of the upstream repository.

---

## 💻 Local Development Workflow

CaféVerse is built on Electron, React, and TypeScript, and powered by the ultra-fast **Bun** runtime.

### 1. Project Setup

```bash
# Install dependencies using Bun
bun install
```

### 2. Live Development

```bash
# Run the app in development mode with live reload
bun run dev
```

### 3. Code Validation

Before committing, ensure your code compiles and follows the style rules:

```bash
# Run typechecking
bun run typecheck

# Run linter checks
bun run lint

# Format the codebase
bun run format
```

---

## ⚠️ Commit Message Format

CaféVerse uses a dynamic release notes generator that automatically groups commits into sections based on their prefixes. **Every commit must be structured as follows**:

```text
<prefix>(<optional-scope>): <description>
```

### Prefix Reference

| Category         | Allowed Prefixes                                  | Description / Examples                                                                             |
| :--------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------- |
| **✨ New**       | `feat:`, `new:`                                   | Added new features or pages. Example: `feat(tv): integrate search recommendations`                 |
| **🐛 Bug Fixed** | `fix:`                                            | Resolved bugs or TypeScript crashes. Example: `fix(player): resolve fullscreen controls`           |
| **🔧 Update**    | `refactor:`, `chore:`, `style:`, `perf:`, `docs:` | Code cleanups, styling updates, CI improvements. Example: `chore(ci): migrate dependencies to bun` |

_For full details and guidelines, see [COMMIT.md](COMMIT.md)._

---

Thank you again for contributing to CaféVerse! ☕
