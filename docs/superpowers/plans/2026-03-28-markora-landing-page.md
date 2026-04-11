# Markora MD Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static HTML/CSS landing page for Markora MD at `https://kelvink96.github.io/markora/` with strong SEO, a Microsoft Store download CTA, and a privacy policy.

**Architecture:** Plain HTML/CSS/JS files in the `docs/` folder, served by GitHub Pages from the `main` branch. No build step. Two pages: `index.html` (landing) and `privacy.html` (privacy policy). SEO covered by meta tags, Open Graph, `robots.txt`, and `sitemap.xml`.

**Tech Stack:** HTML5 · CSS3 · Google Fonts (Geist, IBM Plex Mono) · GitHub Pages

---

## File Map

```
docs/
├── index.html          # Landing page — all sections
├── privacy.html        # Privacy policy page
├── robots.txt          # Allow all, point to sitemap
├── sitemap.xml         # Two URLs: index + privacy
└── assets/
    ├── showcase.png    # Copied from repo root showcase.png
    └── logo.png        # Copied from public/logo.png
```

---

## Task 1: Repo setup — assets and .gitignore

**Files:**
- Modify: `.gitignore`
- Create: `docs/assets/showcase.png` (copy)
- Create: `docs/assets/logo.png` (copy)

- [ ] **Step 1: Add `.superpowers/` to .gitignore**

Open `.gitignore` and append at the end:

```
.superpowers/
tauri.key
tauri.key.pub
```

- [ ] **Step 2: Copy assets into docs/assets/**

```bash
mkdir -p docs/assets
cp showcase.png docs/assets/showcase.png
cp public/logo.png docs/assets/logo.png
```

- [ ] **Step 3: Verify files exist**

```bash
ls docs/assets/
```

Expected output:
```
logo.png  showcase.png
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore docs/assets/
git commit -m "chore: add landing page assets and update gitignore"
```

---

## Task 2: Landing page — `docs/index.html`

**Files:**
- Create: `docs/index.html`

- [ ] **Step 1: Create `docs/index.html` with the full page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Markora MD — Free Markdown Editor for Windows</title>
  <meta name="description" content="Markora MD is a free, fast markdown editor for Windows with live split-pane preview, native file dialogs, and light/dark themes. Built with Tauri and Rust.">
  <meta name="keywords" content="markdown editor, windows markdown editor, free markdown editor, tauri, desktop markdown, live preview markdown">
  <link rel="canonical" href="https://kelvink96.github.io/markora/">

  <!-- Open Graph -->
  <meta property="og:title" content="Markora MD — Free Markdown Editor for Windows">
  <meta property="og:description" content="A free, fast markdown editor for Windows with live split-pane preview, native file dialogs, and light/dark themes.">
  <meta property="og:image" content="https://kelvink96.github.io/markora/assets/showcase.png">
  <meta property="og:url" content="https://kelvink96.github.io/markora/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Markora MD">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Markora MD — Free Markdown Editor for Windows">
  <meta name="twitter:description" content="A free, fast markdown editor for Windows with live split-pane preview, native file dialogs, and light/dark themes.">
  <meta name="twitter:image" content="https://kelvink96.github.io/markora/assets/showcase.png">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="../public/favicon.svg">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
      --dark-bg: #0f172a;
      --dark-surface: #1e293b;
      --dark-border: #334155;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --text-subtle: #475569;
      --light-bg: #f8fafc;
      --light-surface: #ffffff;
      --light-border: #e2e8f0;
      --body-text: #0f172a;
      --body-muted: #64748b;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-ui);
      background: var(--light-surface);
      color: var(--body-text);
      -webkit-font-smoothing: antialiased;
    }

    /* ── NAV ── */
    nav {
      position: sticky; top: 0; z-index: 100;
      background: var(--dark-bg);
      border-bottom: 1px solid var(--dark-surface);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 56px;
    }

    .nav-logo {
      display: flex; align-items: center; gap: 9px;
      color: var(--text-primary); font-weight: 700; font-size: 15px;
      letter-spacing: -0.3px; text-decoration: none;
    }

    .nav-logo-icon {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, var(--accent-light), var(--accent));
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 800;
      font-family: var(--font-mono);
    }

    .nav-cta {
      background: var(--accent); color: #fff;
      border: none; border-radius: 7px;
      padding: 8px 18px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: var(--font-ui);
      letter-spacing: -0.2px; text-decoration: none;
      transition: background 0.15s;
    }
    .nav-cta:hover { background: #4f46e5; }

    /* ── HERO ── */
    .hero {
      background: linear-gradient(180deg, var(--dark-bg) 0%, #131f35 100%);
      padding: 88px 48px 0;
      text-align: center;
    }

    .hero-badge {
      display: inline-block;
      background: var(--dark-surface); color: var(--accent-light);
      border: 1px solid #312e81; border-radius: 20px;
      padding: 5px 16px; font-size: 11px; font-weight: 500;
      margin-bottom: 28px; letter-spacing: 0.3px;
      font-family: var(--font-mono);
    }

    .hero h1 {
      color: var(--text-primary);
      font-size: clamp(32px, 5vw, 52px);
      font-weight: 800; line-height: 1.1;
      letter-spacing: -2px;
      margin-bottom: 18px;
      max-width: 640px; margin-left: auto; margin-right: auto;
    }

    .hero h1 span { color: var(--accent-light); }

    .hero-sub {
      color: var(--text-muted); font-size: 16px;
      max-width: 460px; margin: 0 auto 36px;
      line-height: 1.7; font-weight: 400;
    }

    .hero-actions {
      display: flex; gap: 12px;
      justify-content: center; align-items: center;
      flex-wrap: wrap;
    }

    .btn-primary {
      background: var(--accent); color: #fff;
      border-radius: 9px; padding: 13px 26px;
      font-size: 14px; font-weight: 600;
      display: inline-flex; align-items: center; gap: 9px;
      text-decoration: none; letter-spacing: -0.2px;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #4f46e5; }

    .btn-secondary {
      background: transparent; color: var(--text-muted);
      border: 1px solid var(--dark-border); border-radius: 9px;
      padding: 13px 22px; font-size: 14px;
      display: inline-flex; align-items: center; gap: 8px;
      text-decoration: none;
      transition: border-color 0.15s, color 0.15s;
    }
    .btn-secondary:hover { border-color: var(--text-muted); color: var(--text-primary); }

    .hero-meta {
      margin-top: 24px; margin-bottom: 52px;
      color: var(--text-subtle); font-size: 11px;
      font-family: var(--font-mono); letter-spacing: 0.2px;
    }

    /* ── SCREENSHOT ── */
    .screenshot-section {
      background: linear-gradient(180deg, #131f35 0%, var(--dark-bg) 100%);
      padding: 0 48px 72px;
      text-align: center;
    }

    .app-window {
      max-width: 900px; margin: 0 auto;
      border-radius: 12px; overflow: hidden;
      border: 1px solid var(--dark-surface);
      box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
    }

    .window-bar {
      background: var(--dark-surface);
      padding: 11px 16px;
      display: flex; align-items: center; gap: 7px;
    }

    .dot { width: 11px; height: 11px; border-radius: 50%; }

    .window-title {
      color: var(--text-subtle); font-size: 11px;
      font-family: var(--font-mono);
      margin: 0 auto;
    }

    .app-window img {
      display: block; width: 100%;
      border-top: none;
    }

    /* ── FEATURES ── */
    .features {
      background: var(--light-bg);
      padding: 88px 48px;
      text-align: center;
    }

    .features h2 {
      font-size: clamp(24px, 3vw, 34px);
      font-weight: 800; color: var(--body-text);
      letter-spacing: -1px; margin-bottom: 10px;
    }

    .features-sub {
      color: var(--body-muted); font-size: 16px;
      margin-bottom: 52px;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px; max-width: 940px; margin: 0 auto;
    }

    .feature-card {
      background: var(--light-surface); border-radius: 12px;
      padding: 26px 20px; border: 1px solid var(--light-border);
      text-align: left;
      transition: box-shadow 0.15s;
    }
    .feature-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

    .feature-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #ede9fe;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; margin-bottom: 14px;
    }

    .feature-card h3 {
      font-size: 14px; font-weight: 700; color: var(--body-text);
      margin-bottom: 7px; letter-spacing: -0.2px;
    }

    .feature-card p {
      font-size: 13px; color: var(--body-muted); line-height: 1.6;
    }

    /* ── CTA ── */
    .cta-section {
      background: var(--light-surface);
      padding: 88px 48px; text-align: center;
      border-top: 1px solid var(--light-border);
    }

    .cta-section h2 {
      font-size: clamp(24px, 3vw, 34px);
      font-weight: 800; color: var(--body-text);
      letter-spacing: -1px; margin-bottom: 10px;
    }

    .cta-section p {
      color: var(--body-muted); font-size: 16px;
      margin-bottom: 36px;
    }

    .store-btn {
      display: inline-flex; flex-direction: column; align-items: center;
      background: var(--dark-bg); color: var(--text-primary);
      border-radius: 12px; padding: 15px 32px;
      text-decoration: none; margin-bottom: 16px;
      transition: background 0.15s;
    }
    .store-btn:hover { background: #1e293b; }

    .store-btn-label {
      font-size: 10px; color: var(--text-muted);
      font-family: var(--font-mono); margin-bottom: 3px;
    }

    .store-btn-name {
      font-size: 16px; font-weight: 700; letter-spacing: -0.3px;
    }

    .cta-note {
      display: block; font-size: 12px; color: var(--body-muted);
      font-family: var(--font-mono);
    }

    /* ── FOOTER ── */
    footer {
      background: var(--dark-bg);
      padding: 28px 48px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }

    .footer-logo {
      color: var(--text-primary); font-weight: 700; font-size: 14px;
      letter-spacing: -0.3px; text-decoration: none;
    }

    .footer-links {
      display: flex; gap: 24px;
    }

    .footer-links a {
      color: var(--text-subtle); font-size: 13px;
      text-decoration: none; transition: color 0.15s;
    }
    .footer-links a:hover { color: var(--text-muted); }

    .footer-copy {
      color: var(--text-subtle); font-size: 11px;
      font-family: var(--font-mono);
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 640px) {
      nav { padding: 0 20px; }
      .hero { padding: 64px 20px 0; }
      .screenshot-section { padding: 0 20px 52px; }
      .features { padding: 64px 20px; }
      .cta-section { padding: 64px 20px; }
      footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
      .hero h1 { letter-spacing: -1px; }
    }
  </style>
</head>
<body>

  <!-- NAV -->
  <nav>
    <a class="nav-logo" href="#">
      <div class="nav-logo-icon">M</div>
      Markora MD
    </a>
    <a class="nav-cta" href="https://apps.microsoft.com/detail/9NJDGX8KZDS1" target="_blank" rel="noopener">
      Get it Free →
    </a>
  </nav>

  <main>

    <!-- HERO -->
    <section class="hero" aria-label="Hero">
      <div class="hero-badge">✦ free on microsoft store</div>
      <h1>The markdown editor<br>built for <span>Windows</span>.</h1>
      <p class="hero-sub">
        Live split-pane preview, native file dialogs, light &amp; dark themes —
        no Electron, no browser tab. Just your words.
      </p>
      <div class="hero-actions">
        <a class="btn-primary" href="https://apps.microsoft.com/detail/9NJDGX8KZDS1" target="_blank" rel="noopener">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
          Download on Microsoft Store
        </a>
        <a class="btn-secondary" href="https://github.com/kelvink96/markora" target="_blank" rel="noopener">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          View on GitHub
        </a>
      </div>
      <p class="hero-meta">free forever · windows 10/11 · no account required</p>
    </section>

    <!-- APP SCREENSHOT -->
    <section class="screenshot-section" aria-label="App screenshot">
      <div class="app-window">
        <div class="window-bar">
          <div class="dot" style="background:#ff5f57"></div>
          <div class="dot" style="background:#febc2e"></div>
          <div class="dot" style="background:#28c840"></div>
          <span class="window-title">readme.md — Markora MD</span>
        </div>
        <img
          src="assets/showcase.png"
          alt="Markora MD editor showing the split markdown editor on the left and live HTML preview on the right"
          width="900"
          loading="lazy"
        >
      </div>
    </section>

    <!-- FEATURES -->
    <section class="features" aria-label="Features">
      <h2>Everything you need. Nothing you don't.</h2>
      <p class="features-sub">Built for writers and developers who want to focus on the words.</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">⚡</div>
          <h3>Live Preview</h3>
          <p>Side-by-side editor and rendered output, updated as you type.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">🦀</div>
          <h3>Rust-Powered</h3>
          <p>Markdown parsing in Rust via pulldown-cmark — fast and reliable.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">🗂️</div>
          <h3>Native Files</h3>
          <p>Open and save .md files using native Windows file dialogs.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" aria-hidden="true">🌙</div>
          <h3>Dark &amp; Light</h3>
          <p>Switch between themes instantly. Easy on the eyes, day or night.</p>
        </div>
      </div>
    </section>

    <!-- DOWNLOAD CTA -->
    <section class="cta-section" aria-label="Download">
      <h2>Ready to write?</h2>
      <p>Free on the Microsoft Store. No subscription, no sign-up.</p>
      <a class="store-btn" href="https://apps.microsoft.com/detail/9NJDGX8KZDS1" target="_blank" rel="noopener">
        <span class="store-btn-label">Download on the</span>
        <span class="store-btn-name">Microsoft Store</span>
      </a>
      <span class="cta-note">windows 10 / 11 · free forever · open source on github</span>
    </section>

  </main>

  <!-- FOOTER -->
  <footer>
    <a class="footer-logo" href="#">Markora MD</a>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="privacy.html">Privacy Policy</a>
      <a href="https://github.com/kelvink96/markora" target="_blank" rel="noopener">GitHub</a>
      <a href="mailto:kelvin.kiprop96@gmail.com">Contact</a>
    </nav>
    <span class="footer-copy">© 2026 Kelvin Kiprop</span>
  </footer>

</body>
</html>
```

- [ ] **Step 2: Open `docs/index.html` in a browser and verify all sections render**

Check:
- Nav is sticky and shows "Get it Free →" button
- Hero: h1 heading, two CTA buttons, meta line visible
- Screenshot section: app window chrome + `showcase.png` loads
- Features: 4 cards in a grid
- CTA section: Store button
- Footer: 3 links visible

- [ ] **Step 3: Commit**

```bash
git add docs/index.html
git commit -m "feat: add landing page index.html"
```

---

## Task 3: Privacy policy — `docs/privacy.html`

**Files:**
- Create: `docs/privacy.html`

- [ ] **Step 1: Create `docs/privacy.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Privacy Policy — Markora MD</title>
  <meta name="description" content="Privacy policy for Markora MD. Markora MD does not collect, store, or transmit any personal information.">
  <link rel="canonical" href="https://kelvink96.github.io/markora/privacy.html">

  <!-- Open Graph -->
  <meta property="og:title" content="Privacy Policy — Markora MD">
  <meta property="og:url" content="https://kelvink96.github.io/markora/privacy.html">
  <meta property="og:type" content="website">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
      --dark-bg: #0f172a;
      --dark-surface: #1e293b;
      --dark-border: #334155;
      --accent: #6366f1;
      --accent-light: #818cf8;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --text-subtle: #475569;
      --light-surface: #ffffff;
      --light-border: #e2e8f0;
      --body-text: #0f172a;
      --body-muted: #64748b;
    }

    body {
      font-family: var(--font-ui);
      background: var(--light-surface);
      color: var(--body-text);
      -webkit-font-smoothing: antialiased;
    }

    nav {
      background: var(--dark-bg);
      border-bottom: 1px solid var(--dark-surface);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 48px; height: 56px;
    }

    .nav-logo {
      display: flex; align-items: center; gap: 9px;
      color: var(--text-primary); font-weight: 700; font-size: 15px;
      letter-spacing: -0.3px; text-decoration: none;
    }

    .nav-logo-icon {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, var(--accent-light), var(--accent));
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 13px; font-weight: 800;
      font-family: var(--font-mono);
    }

    .nav-back {
      color: var(--text-muted); font-size: 13px;
      text-decoration: none; transition: color 0.15s;
    }
    .nav-back:hover { color: var(--text-primary); }

    main {
      max-width: 720px; margin: 0 auto;
      padding: 64px 24px 88px;
    }

    .policy-header { margin-bottom: 40px; }

    .policy-header h1 {
      font-size: 36px; font-weight: 800; letter-spacing: -1px;
      color: var(--body-text); margin-bottom: 10px;
    }

    .policy-meta {
      font-size: 12px; color: var(--body-muted);
      font-family: var(--font-mono);
    }

    section { margin-bottom: 36px; }

    h2 {
      font-size: 18px; font-weight: 700; color: var(--body-text);
      letter-spacing: -0.3px; margin-bottom: 10px;
    }

    p { font-size: 15px; color: var(--body-muted); line-height: 1.75; margin-bottom: 12px; }
    p:last-child { margin-bottom: 0; }

    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    .divider {
      border: none; border-top: 1px solid var(--light-border);
      margin: 40px 0;
    }

    footer {
      background: var(--dark-bg);
      padding: 28px 48px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }

    .footer-logo {
      color: var(--text-primary); font-weight: 700; font-size: 14px;
      letter-spacing: -0.3px; text-decoration: none;
    }

    .footer-links { display: flex; gap: 24px; }

    .footer-links a {
      color: var(--text-subtle); font-size: 13px;
      text-decoration: none; transition: color 0.15s;
    }
    .footer-links a:hover { color: var(--text-muted); }

    .footer-copy {
      color: var(--text-subtle); font-size: 11px;
      font-family: var(--font-mono);
    }

    @media (max-width: 640px) {
      nav { padding: 0 20px; }
      main { padding: 40px 20px 64px; }
      footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

  <nav>
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-icon">M</div>
      Markora MD
    </a>
    <a class="nav-back" href="index.html">← Back to home</a>
  </nav>

  <main>
    <div class="policy-header">
      <h1>Privacy Policy</h1>
      <span class="policy-meta">Last updated: 2026-03-28</span>
    </div>

    <section aria-label="Introduction">
      <h2>Introduction</h2>
      <p>
        This privacy policy explains how Markora MD ("the app", "we") handles information
        when you use the application. We are committed to protecting your privacy.
        Markora MD is a local desktop application and is designed to work entirely on your device.
      </p>
    </section>

    <hr class="divider">

    <section aria-label="Data collection">
      <h2>Data We Collect</h2>
      <p>
        <strong>None.</strong> Markora MD does not collect, store, transmit, or share any
        personal information. The app has no analytics, no telemetry, no crash reporting,
        and no user accounts.
      </p>
    </section>

    <hr class="divider">

    <section aria-label="Local storage">
      <h2>Local Storage</h2>
      <p>
        Markora MD saves your preferences (such as theme and editor settings) locally on your
        device only. This data never leaves your machine and is not accessible to us or any
        third party.
      </p>
      <p>
        Your markdown files are stored wherever you choose to save them on your file system.
        We do not have access to your files.
      </p>
    </section>

    <hr class="divider">

    <section aria-label="Third-party services">
      <h2>Third-Party Services</h2>
      <p>
        Markora MD is distributed through the Microsoft Store. When you download the app,
        Microsoft's own privacy policy applies to that transaction. We do not receive any
        personal information from Microsoft as part of this process.
      </p>
      <p>
        You can review Microsoft's privacy policy at
        <a href="https://privacy.microsoft.com" target="_blank" rel="noopener">privacy.microsoft.com</a>.
      </p>
    </section>

    <hr class="divider">

    <section aria-label="Contact">
      <h2>Contact</h2>
      <p>
        If you have any questions about this privacy policy, you can contact us at
        <a href="mailto:kelvin.kiprop96@gmail.com">kelvin.kiprop96@gmail.com</a>.
      </p>
    </section>

  </main>

  <footer>
    <a class="footer-logo" href="index.html">Markora MD</a>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="privacy.html">Privacy Policy</a>
      <a href="https://github.com/kelvink96/markora" target="_blank" rel="noopener">GitHub</a>
      <a href="mailto:kelvin.kiprop96@gmail.com">Contact</a>
    </nav>
    <span class="footer-copy">© 2026 Kelvin Kiprop</span>
  </footer>

</body>
</html>
```

- [ ] **Step 2: Open `docs/privacy.html` in a browser and verify**

Check:
- Nav shows "← Back to home" link that goes to `index.html`
- All 5 sections render with correct headings
- Footer matches `index.html`

- [ ] **Step 3: Commit**

```bash
git add docs/privacy.html
git commit -m "feat: add privacy policy page"
```

---

## Task 4: SEO files — `robots.txt` and `sitemap.xml`

**Files:**
- Create: `docs/robots.txt`
- Create: `docs/sitemap.xml`

- [ ] **Step 1: Create `docs/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://kelvink96.github.io/markora/sitemap.xml
```

- [ ] **Step 2: Create `docs/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kelvink96.github.io/markora/</loc>
    <lastmod>2026-03-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://kelvink96.github.io/markora/privacy.html</loc>
    <lastmod>2026-03-28</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

- [ ] **Step 3: Commit**

```bash
git add docs/robots.txt docs/sitemap.xml
git commit -m "feat: add robots.txt and sitemap.xml for SEO"
```

---

## Task 5: GitHub Pages configuration

This task is done in the GitHub web UI — no code changes.

- [ ] **Step 1: Push all commits to main**

```bash
git push origin main
```

- [ ] **Step 2: Enable GitHub Pages**

1. Open `https://github.com/kelvink96/markora/settings/pages`
2. Under **Source**, select **Deploy from a branch**
3. Branch: `main` · Folder: `/docs`
4. Click **Save**

- [ ] **Step 3: Wait ~60 seconds, then verify the live site**

Open `https://kelvink96.github.io/markora/` in a browser.

Check:
- Page loads (not 404)
- `showcase.png` displays correctly
- "Get it Free →" and "Download on Microsoft Store" links go to the Microsoft Store
- Privacy Policy link opens `privacy.html`
- "View on GitHub" opens the GitHub repo

- [ ] **Step 4: Verify SEO meta tags**

Open browser DevTools → Elements and confirm `<head>` contains:
- `<title>Markora MD — Free Markdown Editor for Windows</title>`
- `<meta name="description" ...>`
- `<meta property="og:image" ...>`
- `<link rel="canonical" ...>`

- [ ] **Step 5: Add the website URL to the Microsoft Store Partner Center**

In Partner Center → Properties → Website field, enter:
```
https://kelvink96.github.io/markora/
```

Also add the privacy policy URL to any privacy field:
```
https://kelvink96.github.io/markora/privacy.html
```
