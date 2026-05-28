# ☕ CaféVerse

**A premium, ultra-responsive desktop client for movies and TV shows metadata.**  
Built with Electron, React, TypeScript, Tailwind CSS 4.0, and powered by Bun.

![Powered by Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white) ![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Tailwind CSS 4.0](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Features

- 🎬 **Cinematic Full-Bleed Pages:** Experience beautiful media presentation with smooth gradient banners, live IMDB scores, casting details, and similar recommendation carousels.
- ⚡ **Embedded Media Player:** Fully customizable integrated video player featuring:
  - Custom aesthetic styling & UI color synchronization.
  - Flexible subtitle tracking (`.srt` and `.vtt`) with auto-search capabilities.
  - Smart state restoration (resume playback where you left off).
- 📺 **Comprehensive Catalog:** Seamlessly browse, search, and filter massive movie and television databases powered by high-performance APIs.
- ⭐ **Local Watchlist:** A persisted, interactive watchlist built directly into the client with localStorage sync.
- 📂 **Auto-Generated Next.js-Style Routing:** Includes custom file-system routing scanner that converts classic folder schemas into standard React Router `:param` segments at build time.
- 💻 **Cross-Platform Compilation:** Packaging support for high-performance Windows and Linux application executables.

---

## 🛠️ Tech Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh/) (ultra-fast dependency and task runner)
- **Framework Core:** [Electron](https://www.electronjs.org/) + [React 19](https://react.dev/) + [Vite 7](https://vite.dev/)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Aesthetic Styling:** [Tailwind CSS 4.0](https://tailwindcss.com/) + [Lucide React Icons](https://lucide.dev/)
- **State Management & Routing:** [React Router 7](https://reactrouter.com/) + custom dynamic glob route scanning
- **Packaging:** [Electron Builder](https://www.electron.build/)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed locally on your operating system.

### 📥 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/VikumKarunathilake/movies-app.git
cd movies-app

# Install dependencies using Bun (takes < 10 seconds)
bun install
```

### 💻 2. Run in Development Mode

Launches the Electron main process with full Hot Module Replacement (HMR) for the renderer view:

```bash
bun run dev
```

### 🔒 3. Static Code Analysis

Ensure clean compilation and type correctness before building your release packages:

```bash
# Typecheck renderer & node configurations
bun run typecheck

# Lint formatting rules
bun run lint
```

### 📦 4. Build & Package Locally

To bundle and package a native platform installer locally in your `/dist` folder:

```bash
# Package for Windows (produces .exe, .msi, and .zip installers)
bun run build:win

# Package for Linux (produces .AppImage and .deb installers)
bun run build:linux
```

---

## ⚙️ Automated CI/CD & Releases

This repository utilizes an optimized **GitHub Actions** workflow (`Build and Auto-Release App`) triggered manually via `workflow_dispatch`.

Whenever a release is triggered:

1. **Prepare Release:** Auto-increments your version tag, creates a release branch commit, and drafts a new GitHub Release.
2. **Build Matrix (Bun-powered):** Windows-x64 and Linux-x64 runner environments spin up, download dependencies in under 10 seconds with Bun, and package native binaries.
3. **Publish:** The workflow attaches all built installers (`.exe`, `.msi`, `.zip`, `.AppImage`, `.deb`) onto the GitHub Release draft and automatically publishes it.

---

## 🤝 Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on code style, dynamic release commit conventions, local development flow, and how to submit Pull Requests.

## 🛡️ DMCA Disclaimer

CaféVerse is a client application providing media metadata indexation:

- **No Video Hosting:** This application does **not** host, store, upload, or broadcast any video files, media streams, or copyrighted video contents on its servers.
- **Content Aggregation:** All playback is handled via external, non-affiliated third-party player embeds. CaféVerse acts strictly as an aggregator and browser interface for streams hosted by other services.
- **Takedowns:** If you are a copyright owner and want to request removal of copyrighted streams, please direct your requests to the respective third-party hosting services hosting the content. If you believe your copyrighted metadata is indexed in infringement, you may submit a notice as outlined in our in-app **DMCA Copyright Policy**.

Made with ☕ by the [CaféVerse Team](TEAM.md).
