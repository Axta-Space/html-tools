# html-tools — Claude conventions

## What this repo is

Static HTML/JS tools built for Axta engineering workflows. Each tool lives in its own subfolder as a **single self-contained HTML file** with inline CSS and JS. No build step, no npm, no server. Deployed via GitHub Pages from `main`.

## Repo structure

```
html-tools/
  index.html          ← tool directory / nav page
  CLAUDE.md
  .github/
    workflows/
      claude.yml      ← Claude Code Action
      pages.yml       ← GitHub Pages deploy
  <tool-name>/
    index.html
```

## File conventions

- **One file per tool**: all CSS and JS inline in the HTML file. No separate `.js` or `.css` files unless the tool is genuinely multi-page.
- **CDN only** for libraries — no npm, no build step. Use pinned versions (e.g. `d3@7.9.0`). Load from `https://cdn.jsdelivr.net/npm/` or `https://cdnjs.cloudflare.com/`.
- **Prefer URL params / in-memory state** over `localStorage` for user-facing settings — this keeps tools shareable by URL. **Exception:** a tool MAY use `localStorage` to cache responses from rate-limited external APIs. Example: `Sat-Tracker` caches CelesTrak TLE data (CelesTrak allows ~1 fetch per ~2 hours).
- **No frameworks** — vanilla JS + D3/Plotly/etc as needed. Keep the dependency count low.

## Style conventions

- **Light theme always** — `background: #fff` or near-white, dark text.
- **Mobile-first** — design for iPhone 16 Pro portrait (393px logical width) first, then scale up.
- **iOS Safari safe areas** — use `env(safe-area-inset-*)` for padding near edges and bottom.
- **Suppress iOS double-tap zoom**: `touch-action: manipulation` on interactive elements; `user-scalable=no` in viewport meta. **Exception:** content-heavy reference pages (e.g. `html-controls`) may leave pinch-zoom enabled for accessibility.
- **Manual version stamping**: there's no build step, so the version/date shown in the nav footer (`index.html`) and each tool's home-nav meta are bumped by hand per release.
- **Font stack**: system-ui or a CDN-loaded font — never Arial or generic fallbacks as the primary.
- Axta brand: parent brand is `axta` (lowercase). Products follow `AxtaXXXX` pattern with suffix ALL-CAPS (e.g. `AxtaLINK`, `AxtaBEAMS`).

## AxtaLINK integration

Tools may call the AxtaLINK API for satcom calculations:

- **Production base URL**: `https://axtalink-app.blackflower-593772e8.eastus.azurecontainerapps.io`
- Store the base URL in a `const AXTALINK_BASE` at the top of the file for easy override.
- Use `fetch()` with `Content-Type: application/json`.
- Handle errors gracefully — show a visible error state, never silently fail.
- CORS is configured on the AxtaLINK server to allow the GitHub Pages origin.

## Variable naming (satcom)

Follow AxtaLINK conventions for satcom quantities — unit-explicit suffixes:

- `_dbw` — power in dBW
- `_db` — dimensionless dB ratio
- `_km` — distance in kilometers
- `_deg` — angle in degrees
- `_GHz` — frequency in GHz

## Per-tool README (optional)

Each tool subfolder may have a `README.md` describing its purpose, inputs, and any AxtaLINK endpoints it uses.

## GitHub workflow

- **Repo**: `https://github.com/axta-space/html-tools`
- **Pages URL**: `https://axta-space.github.io/html-tools/`
- **Issues**: describe the feature or bug. Use `@claude` to trigger Claude Code Action.
- **PRs**: Claude creates a draft PR. Review the diff + GitHub Pages preview on `main` after merge.
- **Commit messages**: `feat(tool-name): description` or `fix(tool-name): description`.
- Always update `index.html` nav when adding a new tool.
- Always update this `CLAUDE.md` if conventions change.
