# Markora MD Landing Page — Design Spec

**Date:** 2026-03-28
**URL:** https://kelvink96.github.io/markora/
**Status:** Approved

---

## Goal

Create a static landing page for Markora MD hosted on GitHub Pages from the `docs/` folder of the main repo. The page must have strong SEO, a clear download CTA, a privacy policy, and match the visual identity of the app.

---

## Hosting & Deployment

- **Source:** `docs/` folder on the `main` branch
- **GitHub Pages setting:** Serve from `main` branch, `/docs` folder
- **No build step** — plain HTML/CSS/JS only
- **Deploy trigger:** Automatic on push to `main`

---

## Files

```
docs/
├── index.html        # Landing page
├── privacy.html      # Privacy policy
├── robots.txt        # SEO: allow all, point to sitemap
├── sitemap.xml       # SEO: list index.html and privacy.html
└── assets/
    ├── showcase.png  # Real app screenshot (copied from repo root)
    └── logo.png      # App logo (copied from public/logo.png)
```

---

## Visual Design

### Style
- **Dark hero + light body** layout
- Dark sections: `#0f172a` background
- Light sections: `#f8fafc` / `#ffffff` background
- Accent color: `#6366f1` (indigo)

### Typography (Google Fonts)
- **Geist** — all UI text (headings, body, nav, buttons)
- **IBM Plex Mono** — badges, meta lines, monospace accents
- **Source Serif 4** — not used on landing page (app-internal only)

### Fonts loaded via:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Page Sections — `index.html`

### 1. Nav
- Logo (icon + "Markora MD" in Geist)
- "Get it Free →" button (right-aligned, indigo)
- Dark background, sticky on scroll

### 2. Hero (dark)
- Badge: `✦ free on microsoft store` (IBM Plex Mono, indigo)
- `<h1>`: "The markdown editor built for Windows."
- Subtext: value prop (live preview, native files, no Electron)
- Primary CTA: "Download on Microsoft Store" (indigo button, Windows logo icon)
- Secondary CTA: "View on GitHub" (ghost button)
- Meta line: `free forever · windows 10/11 · no account required` (IBM Plex Mono, muted)

### 3. App Screenshot (dark, continuation of hero)
- `<img src="assets/showcase.png" alt="Markora MD editor showing split markdown and preview panes">`
- Framed in a mock window chrome (traffic-light dots, filename bar)
- Drop shadow, rounded corners
- Max width 860px, centered

### 4. Features (light `#f8fafc`)
- `<h2>`: "Everything you need. Nothing you don't."
- 4 feature cards in a grid:
  | Icon | Title | Description |
  |------|-------|-------------|
  | ⚡ | Live Preview | Side-by-side editor and rendered output, updated as you type. |
  | 🦀 | Rust-Powered | Markdown parsing in Rust via pulldown-cmark — fast and reliable. |
  | 🗂️ | Native Files | Open and save .md files using native Windows file dialogs. |
  | 🌙 | Dark & Light | Switch between themes instantly. Easy on the eyes, day or night. |

### 5. Download CTA (white)
- `<h2>`: "Ready to write?"
- Subtext: "Free on the Microsoft Store. No subscription, no sign-up."
- Microsoft Store badge/button (dark, rounded)
- Meta: `windows 10 / 11 · free forever · open source on github`

### 6. Footer (dark `#0f172a`)
- Left: "Markora MD" logo text
- Center: Privacy Policy · GitHub · Contact (email)
- Right: "© 2026 Kelvin Kiprop"

---

## Privacy Policy — `privacy.html`

Same nav and footer as `index.html`. Content covers:

1. **Introduction** — what this policy covers
2. **Data we collect** — none (app does not collect, store, or transmit personal data)
3. **Local storage** — settings saved locally on the user's machine only
4. **Third-party services** — Microsoft Store distribution (governed by Microsoft's privacy policy)
5. **Contact** — kelvin.kiprop96@gmail.com
6. **Last updated** — 2026-03-28

---

## SEO

Every HTML page includes:

```html
<title>Markora MD — Free Markdown Editor for Windows</title>
<meta name="description" content="Markora MD is a free, fast markdown editor for Windows with live split-pane preview, native file dialogs, and light/dark themes. Built with Tauri and Rust.">
<meta name="keywords" content="markdown editor, windows markdown, free markdown editor, tauri, desktop markdown">
<link rel="canonical" href="https://kelvink96.github.io/markora/">

<!-- Open Graph -->
<meta property="og:title" content="Markora MD — Free Markdown Editor for Windows">
<meta property="og:description" content="...">
<meta property="og:image" content="https://kelvink96.github.io/markora/assets/showcase.png">
<meta property="og:url" content="https://kelvink96.github.io/markora/">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Markora MD — Free Markdown Editor for Windows">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://kelvink96.github.io/markora/assets/showcase.png">
```

Semantic HTML:
- Single `<h1>` per page
- Proper `<main>`, `<nav>`, `<footer>`, `<section>` landmarks
- `lang="en"` on `<html>`
- Alt text on all images

### `robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://kelvink96.github.io/markora/sitemap.xml
```

### `sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kelvink96.github.io/markora/</loc><priority>1.0</priority></url>
  <url><loc>https://kelvink96.github.io/markora/privacy.html</loc><priority>0.3</priority></url>
</urlset>
```

---

## GitHub Pages Setup

After pushing:
1. Go to repo **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, Folder: `/docs`
4. Save — site goes live at `https://kelvink96.github.io/markora/`

Also add `.superpowers/` to `.gitignore` if not already present.

---

## Out of Scope

- JavaScript interactivity beyond anchor links
- Analytics / tracking (none — consistent with privacy policy)
- Blog or changelog page
- Multi-language support
