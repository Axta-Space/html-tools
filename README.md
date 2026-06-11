# axta HTML Tools

🚀 **Live Tools:**

https://axta-space.github.io/html-tools/

Static HTML/JS tools built for axta engineering workflows. Each tool is a single self-contained HTML file with inline CSS and JS. No build step, no npm, no server required.

## 🛠️ Available Tools

### [BEAM-EDITOR](https://axta-space.github.io/html-tools/beam-editor/)
D3-based beam editor for visualizing and manipulating beam coverage. Interactive beam pattern editing with real-time visualization.

### [SAT-TRACKER](https://axta-space.github.io/html-tools/Sat-Tracker/)
Real-time satellite tracking and orbital visualization. Track satellites in real-time with interactive orbital mechanics.

### [HTML Controls Field Guide](https://axta-space.github.io/html-tools/html-controls/)
Reference for 25 essential form controls with interactive demos — both native elements and common composed patterns (toggles, chips, tag inputs).

## 🏗️ Architecture

This project follows a **zero-build** philosophy:

- **Single-file tools** — Each tool is a complete HTML file with inline CSS and JavaScript
- **CDN dependencies** — External libraries loaded from `jsdelivr.net` or `cdnjs.cloudflare.com` with pinned versions
- **URL / in-memory state** — Shareable by URL; `localStorage` is used only to cache rate-limited external APIs (e.g. Sat-Tracker's TLE data)
- **Mobile-first** — Designed for iPhone 16 Pro portrait (393px) with iOS Safari optimizations
- **Light theme** — Clean, professional appearance with system fonts

## 🔗 AxtaLINK Integration

Tools integrate with the AxtaLINK API for satellite communication calculations:

- **Production API:** `https://axtalink-app.blackflower-593772e8.eastus.azurecontainerapps.io`
- **CORS enabled** for GitHub Pages origin
- **Graceful error handling** with visible error states
- **Consistent variable naming** with unit-explicit suffixes (`_dbw`, `_km`, `_deg`, etc.)

## 💻 Development

### Style Guidelines

- **Light theme always** — `background: #fff` or near-white
- **iOS Safari safe areas** — `env(safe-area-inset-*)` for proper spacing
- **Touch optimization** — `touch-action: manipulation` and `user-scalable=no`
- **System fonts** — `system-ui` or CDN fonts, never Arial/generic fallbacks
- **axta branding** — parent brand `axta` (lowercase); products follow `AxtaXXXX`

### File Conventions

```
html-tools/
  index.html          ← tool directory / nav page
  CLAUDE.md          ← development conventions
  <tool-name>/
    index.html       ← complete tool implementation
```

## 🤝 Contributing

1. **Create issues** at https://github.com/axta-space/html-tools/issues
2. **Tag @claude** to trigger automated development
3. **Review PRs** and test on the GitHub Pages preview
4. **Follow conventions** in `CLAUDE.md` for consistency

### Commit Format
- `feat(tool-name): description` — new features
- `fix(tool-name): description` — bug fixes
- Always update `index.html` navigation when adding tools

## 📦 Deployment

Deployed automatically via GitHub Pages from the `main` branch:
- **Repository:** https://github.com/axta-space/html-tools
- **Live site:** https://axta-space.github.io/html-tools/
- **Auto-deploy:** Push to `main` triggers immediate deployment

---

Built with ❤️ for axta engineering teams
