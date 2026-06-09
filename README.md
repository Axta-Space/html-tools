# <span style="color: #1a6ef5">Axta</span> HTML Tools

🚀 **Live Tools:
** https://dbetts-dev.github.io/html-tools/

Static HTML/JS tools built for <span style="color: #1a6ef5">Axta</span> engineering workflows. Each tool is a single self-contained HTML file with inline CSS and JS. No build step, no npm, no server required.

## 🛠️ Available Tools

### [BEAM-EDITOR](https://dbetts-dev.github.io/html-tools/beam-editor/)
D3-based beam editor for visualizing and manipulating beam coverage. Interactive beam pattern editing with real-time visualization.

### [SAT-TRACKER](https://dbetts-dev.github.io/html-tools/Sat-Tracker/)  
Real-time satellite tracking and orbital visualization. Track satellites in real-time with interactive orbital mechanics.

### [HTML Controls Field Guide](https://dbetts-dev.github.io/html-tools/html-controls/)
Comprehensive reference for 25 native HTML controls with interactive demos. Perfect for understanding form controls and their capabilities.

## 🏗️ Architecture

This project follows a **zero-build** philosophy:

- **Single-file tools** — Each tool is a complete HTML file with inline CSS and JavaScript
- **CDN dependencies** — External libraries loaded from `jsdelivr.net` or `cdnjs.cloudflare.com` with pinned versions
- **No localStorage** — State managed via URL parameters or in-memory for shareability
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
- **<span style="color: #1a6ef5">Axta</span> branding** — Parent brand in blue, products use actual names

### File Conventions

```
html-tools/
  index.html          ← tool directory / nav page
  CLAUDE.md          ← development conventions
  <tool-name>/
    index.html       ← complete tool implementation
```

## 🤝 Contributing

1. **Create issues** at https://github.com/dbetts-dev/html-tools/issues
2. **Tag @claude** to trigger automated development
3. **Review PRs** and test on the GitHub Pages preview
4. **Follow conventions** in `CLAUDE.md` for consistency

### Commit Format
- `feat(tool-name): description` — new features
- `fix(tool-name): description` — bug fixes  
- Always update `index.html` navigation when adding tools

## 📦 Deployment

Deployed automatically via GitHub Pages from the `main` branch:
- **Repository:** https://github.com/dbetts-dev/html-tools
- **Live site:** https://dbetts-dev.github.io/html-tools/
- **Auto-deploy:** Push to `main` triggers immediate deployment

---

Built with ❤️ for <span style="color: #1a6ef5">Axta</span> engineering teams