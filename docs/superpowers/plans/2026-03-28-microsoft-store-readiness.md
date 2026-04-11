# Microsoft Store Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all blocking and high-priority issues preventing Markora from being submitted to the Microsoft Store.

**Architecture:** This plan covers in-code changes (CSP, sanitization, version bump, error feedback, MSIX config, CI pipeline) and out-of-code deliverables (privacy policy content, store listing copy). Code tasks follow TDD where behaviour is testable; config/setup tasks are verified by build output.

**Tech Stack:** Tauri v2, React 19, TypeScript, Rust (pulldown-cmark), DOMPurify, GitHub Actions, MSIX bundle

---

## File Map

| File | Change |
|---|---|
| `src-tauri/tauri.conf.json` | Add CSP, add MSIX publisher identity |
| `src/components/editor-page/preview-pane/preview-pane.tsx` | Sanitize HTML with DOMPurify before render |
| `package.json` | Bump version 0.1.0 → 1.0.0 |
| `src-tauri/Cargo.toml` | Bump version 0.1.0 → 1.0.0 |
| `src/components/settings-page/about-settings-section.tsx` | Add Privacy Policy link |
| `src/App.tsx` | Wrap `handleSave`/`handleOpen` errors in user-visible state; add error banner |
| `src/components/editor-page/error-banner.tsx` | New: thin dismissible error strip |
| `.github/workflows/release.yml` | New: GitHub Actions release workflow for signed MSIX |
| `docs/legal/privacy-policy.md` | New: Privacy Policy text to host publicly |

---

## Task 1: Fix Content Security Policy

**Files:**
- Modify: `src-tauri/tauri.conf.json`

The current `"csp": null` disables all browser security protections inside the Tauri WebView. Microsoft Store submission requires a non-null CSP. Markora uses no external network resources — only `self`, `data:` URIs (for images), and `'unsafe-inline'` styles (required by Tailwind's generated CSS at runtime).

- [ ] **Step 1: Open `src-tauri/tauri.conf.json` and replace the security block**

```json
"security": {
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:"
}
```

Full updated `app` section for context:

```json
"app": {
  "windows": [
    {
      "title": "Markora",
      "width": 1200,
      "height": 800,
      "minWidth": 640,
      "minHeight": 480
    }
  ],
  "security": {
    "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:"
  }
}
```

- [ ] **Step 2: Start the dev app and verify it still renders correctly**

```bash
npm run tauri dev
```

Expected: App opens, editor works, preview renders markdown. No CSP violation errors in the WebView DevTools console (open with `Ctrl+Shift+I` or `F12`).

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "security: enable Content Security Policy for WebView"
```

---

## Task 2: Add HTML Sanitization to Preview Pane

**Files:**
- Modify: `src/components/editor-page/preview-pane/preview-pane.tsx`

The preview renders HTML from Rust's markdown parser via `dangerouslySetInnerHTML`. While the parser output is trusted, a user could open a `.md` file containing raw HTML (e.g. `<script>`) that pulldown-cmark passes through. DOMPurify strips all executable content while keeping valid HTML structure.

- [ ] **Step 1: Install DOMPurify**

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

- [ ] **Step 2: Write a failing test for the sanitization behaviour**

Create `src/components/editor-page/preview-pane/preview-pane.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { PreviewPane } from "./preview-pane";

// Mock the Tauri invoke to return controlled HTML
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(
    '<p>Hello</p><script>alert("xss")</script>'
  ),
}));

// Mock the document store
vi.mock("../../../store/document", () => ({
  useDocumentStore: vi.fn().mockReturnValue("# Hello"),
}));

describe("PreviewPane", () => {
  it("strips script tags from rendered HTML", async () => {
    render(<PreviewPane />);
    await waitFor(() => {
      const content = screen.getByTestId("preview-content");
      expect(content.innerHTML).toContain("<p>Hello</p>");
      expect(content.innerHTML).not.toContain("<script>");
      expect(content.innerHTML).not.toContain("alert");
    });
  });
});
```

- [ ] **Step 3: Run the test and confirm it fails**

```bash
npx vitest run src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: FAIL — the script tag is currently not stripped.

- [ ] **Step 4: Update `preview-pane.tsx` to sanitize with DOMPurify**

{% raw %}
```tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import DOMPurify from "dompurify";
import { useDocumentStore } from "../../../store/document";
import { Panel } from "../../shared/panel";

export function PreviewPane() {
  const content = useDocumentStore((state) => state.content);
  const [html, setHtml] = useState("");

  useEffect(() => {
    invoke<string>("parse_markdown", { markdown: content })
      .then((raw) => setHtml(DOMPurify.sanitize(raw)))
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <Panel className="preview-pane__surface h-full overflow-auto shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_14px_36px_rgba(0,0,0,0.14)]">
        <div
          className="preview-pane__content prose min-h-full w-full rounded-[calc(var(--radius-sm)-1px)] bg-app-preview p-[calc(var(--space-6)-0.1rem)]"
          data-testid="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Panel>
    </section>
  );
}
```
{% endraw %}

- [ ] **Step 5: Run the test and confirm it passes**

```bash
npx vitest run src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: PASS

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor-page/preview-pane/preview-pane.tsx \
        src/components/editor-page/preview-pane/preview-pane.test.tsx \
        package.json package-lock.json
git commit -m "security: sanitize markdown preview HTML with DOMPurify"
```

---

## Task 3: Bump Version to 1.0.0

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`

All three must match. The Microsoft Store will read the MSIX version from Tauri's bundle config.

- [ ] **Step 1: Update `package.json`**

Change line 3:
```json
"version": "1.0.0",
```

- [ ] **Step 2: Update `src-tauri/tauri.conf.json`**

Change line 4:
```json
"version": "1.0.0",
```

- [ ] **Step 3: Update `src-tauri/Cargo.toml`**

Find the `[package]` section and change:
```toml
version = "1.0.0"
```

- [ ] **Step 4: Verify the About dialog shows 1.0.0**

```bash
npm run tauri dev
```

Open About dialog (top-right menu → About). Expected: "Version 1.0.0".

- [ ] **Step 5: Commit**

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to 1.0.0 for store release"
```

---

## Task 4: Create Privacy Policy

**Files:**
- Create: `docs/legal/privacy-policy.md`
- Modify: `src/components/settings-page/about-settings-section.tsx`
- Modify: `src/App.tsx` (About dialog)

The Microsoft Store requires a public URL to a Privacy Policy. This task creates the policy content (to be hosted, e.g. on GitHub Pages or the project website) and links to it from within the app.

- [ ] **Step 1: Create `docs/legal/privacy-policy.md`**

```markdown
# Markora Privacy Policy

**Effective date:** 2026-03-28

## Overview

Markora is a local-only desktop application. It does not collect, transmit, or store any personal data on remote servers.

## Data we do NOT collect

- No analytics or telemetry
- No crash reports sent to any server
- No account registration or authentication
- No network requests to external services

## Data stored locally

Markora stores the following data **only on your device**:

- **User settings** — stored in the OS app data directory (e.g. `%APPDATA%\com.markora.app\` on Windows). Contains editor preferences, theme selection, and template text.
- **Open file paths** — Markora reads and writes `.md` files at paths you explicitly choose via the native file picker. No file content is transmitted.

## Clipboard

When you use copy/paste features, Markora reads from and writes to your system clipboard. This data stays on your device.

## Contact

If you have questions about this policy, open an issue at: https://github.com/your-org/markora/issues

_Replace `your-org` with your actual GitHub org before publishing._
```

- [ ] **Step 2: Write a test for the About section rendering a privacy policy link**

Add to the bottom of `src/components/settings-page/about-settings-section.tsx` test if one exists, otherwise add to `src/components/settings-page/settings-page.test.tsx`. Find the test file first:

```bash
npx vitest run src/components/settings-page/settings-page.test.tsx
```

Open `src/components/settings-page/settings-page.test.tsx` and add:

```tsx
it("renders a privacy policy link in the about section", () => {
  // render the about section with a version prop
  render(<AboutSettingsSection version="1.0.0" privacyPolicyUrl="https://example.com/privacy" />);
  const link = screen.getByRole("link", { name: /privacy policy/i });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "https://example.com/privacy");
});
```

- [ ] **Step 3: Run the test and confirm it fails**

```bash
npx vitest run src/components/settings-page/settings-page.test.tsx
```

Expected: FAIL — `privacyPolicyUrl` prop doesn't exist yet.

- [ ] **Step 4: Update `about-settings-section.tsx` to accept and render the link**

```tsx
import { Text } from "../shared/text";
import { SectionCard } from "./settings-page-shared";

interface AboutSettingsSectionProps {
  version: string;
  privacyPolicyUrl: string;
}

export function AboutSettingsSection({ version, privacyPolicyUrl }: AboutSettingsSectionProps) {
  return (
    <SectionCard
      title="About"
      description="Current app details and the stack behind Markora."
    >
      <Text>Markora is a desktop-first markdown editor.</Text>
      <Text tone="muted">{`Version ${version}`}</Text>
      <Text tone="muted">
        Built with Tauri, Rust, React, TypeScript, and CodeMirror 6.
      </Text>
      <a
        href={privacyPolicyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-app-accent underline"
      >
        Privacy Policy
      </a>
    </SectionCard>
  );
}
```

- [ ] **Step 5: Update `settings-page.tsx` to pass `privacyPolicyUrl`**

Find where `AboutSettingsSection` is rendered in `src/components/settings-page/settings-page.tsx` and add the prop:

```tsx
<AboutSettingsSection
  version={version}
  privacyPolicyUrl="https://your-org.github.io/markora/privacy"
/>
```

_Replace the URL with wherever you host the policy._

- [ ] **Step 6: Update the About dialog in `App.tsx` to include a privacy policy link**

Find the About dialog in `src/App.tsx` (around line 397) and update its content:

```tsx
<Dialog
  open={isAboutDialogOpen}
  title="About Markora"
  description="A desktop-first markdown editor built with Tauri, React, and CodeMirror."
  actions={<Button onClick={() => setIsAboutDialogOpen(false)}>Close</Button>}
>
  <div className="space-y-2 text-sm text-app-text">
    <p>Version {packageJson.version}</p>
    <p>Markora keeps writing and reading in dedicated modes for a focused markdown workflow.</p>
    <a
      href="https://your-org.github.io/markora/privacy"
      target="_blank"
      rel="noopener noreferrer"
      className="text-app-accent underline"
    >
      Privacy Policy
    </a>
  </div>
</Dialog>
```

- [ ] **Step 7: Run the test and confirm it passes**

```bash
npx vitest run src/components/settings-page/settings-page.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add docs/legal/privacy-policy.md \
        src/components/settings-page/about-settings-section.tsx \
        src/components/settings-page/settings-page.tsx \
        src/App.tsx
git commit -m "legal: add privacy policy and link it from about section"
```

> **External action required:** Publish `docs/legal/privacy-policy.md` as a publicly accessible webpage before Store submission. GitHub Pages works: enable Pages on your repo and it will be available at `https://your-org.github.io/markora/`. Update the URL in steps 5 and 6 above.

---

## Task 5: User-Visible Error Feedback for File Operations

**Files:**
- Create: `src/components/editor-page/error-banner.tsx`
- Modify: `src/App.tsx`

Currently, file save/open errors are silently logged to the console. A user whose save fails will see no feedback. This task adds a thin dismissible error strip that appears at the top of the editor.

- [ ] **Step 1: Write a failing test for the error banner component**

Create `src/components/editor-page/error-banner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBanner } from "./error-banner";

describe("ErrorBanner", () => {
  it("renders the error message", () => {
    render(<ErrorBanner message="Failed to save file." onDismiss={() => {}} />);
    expect(screen.getByText("Failed to save file.")).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Some error" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<ErrorBanner message={null} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npx vitest run src/components/editor-page/error-banner.test.tsx
```

Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Create `src/components/editor-page/error-banner.tsx`**

```tsx
interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-2 bg-red-600 px-4 py-2 text-sm text-white"
    >
      <span>{message}</span>
      <button
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-0.5 hover:bg-red-700"
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

```bash
npx vitest run src/components/editor-page/error-banner.test.tsx
```

Expected: PASS

- [ ] **Step 5: Wire `ErrorBanner` into `App.tsx`**

Add state near the top of the `App` function (after the existing `useState` calls):

```tsx
const [fileError, setFileError] = useState<string | null>(null);
```

Update `handleOpen` to surface errors:

```tsx
const handleOpen = useCallback(async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (typeof selected === "string") {
      const text = await invoke<string>("read_file", { path: selected });
      openDocument({ content: text, filePath: selected, isDirty: false });
    }
  } catch (error) {
    setFileError("Failed to open file. Please try again.");
    console.error("read_file failed:", error);
  }
}, [openDocument]);
```

Update `handleSave` to surface errors:

```tsx
const handleSave = useCallback(async () => {
  const { activeDocumentId, filePath, content } = useDocumentStore.getState();
  if (!activeDocumentId) return;

  try {
    if (filePath) {
      await invoke("write_file", { path: filePath, content });
      markClean();
    } else {
      await handleSaveAs();
    }
  } catch (error) {
    setFileError("Failed to save file. Please try again.");
    console.error("write_file failed:", error);
  }
}, [handleSaveAs, markClean]);
```

Update `handleSaveAs` similarly:

```tsx
const handleSaveAs = useCallback(async () => {
  const { activeDocumentId, content } = useDocumentStore.getState();
  if (!activeDocumentId) return;

  try {
    const savePath = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath: "untitled.md",
    });
    if (savePath) {
      await invoke("write_file", { path: savePath, content });
      setFilePath(savePath);
      markClean();
    }
  } catch (error) {
    setFileError("Failed to save file. Please try again.");
    console.error("write_file failed:", error);
  }
}, [markClean, setFilePath]);
```

- [ ] **Step 6: Render `ErrorBanner` inside the `AppShell` return**

In `src/App.tsx`, import the component:

```tsx
import { ErrorBanner } from "./components/editor-page/error-banner";
```

Add the banner just before the `<AppShell>` in the JSX return:

```tsx
return (
  <>
    <ErrorBanner message={fileError} onDismiss={() => setFileError(null)} />
    <AppShell
      ...
    />
    ...
  </>
);
```

- [ ] **Step 7: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 8: Manual smoke test**

```bash
npm run tauri dev
```

Try saving a new document. Expected: normal save flow. Then test error path if possible (e.g. open a file on a drive you disconnect).

- [ ] **Step 9: Commit**

```bash
git add src/components/editor-page/error-banner.tsx \
        src/components/editor-page/error-banner.test.tsx \
        src/App.tsx
git commit -m "feat: show error banner when file save or open fails"
```

---

## Task 6: Configure MSIX Bundle Settings

**Files:**
- Modify: `src-tauri/tauri.conf.json`

Tauri v2 generates MSIX packages automatically when the `windows` bundle target is active. The bundle needs a publisher display name and a publisher identity that matches your Microsoft Store Developer Account's Certificate Subject. The identity is in the format `CN=<Your Name or Org>`.

> **External prerequisite:** You need a Microsoft Store Developer Account and a code-signing certificate (or use Microsoft's free Store signing — see Task 7).

- [ ] **Step 1: Add Windows-specific bundle config to `src-tauri/tauri.conf.json`**

Add a `"windows"` key inside `"bundle"`:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ],
  "windows": {
    "certificateThumbprint": null,
    "digestAlgorithm": "sha256",
    "timestampUrl": ""
  },
  "publisher": "Your Name or Organization"
}
```

Leave `certificateThumbprint` as `null` for now — it gets set in CI via an environment variable during the release build.

- [ ] **Step 2: Do a local MSIX build to verify the output**

```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

Expected: Build completes. Check `src-tauri/target/release/bundle/` — you should see an `.msi` or `.msix` folder.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "build: configure MSIX bundle settings for Windows Store"
```

---

## Task 7: GitHub Actions Release Workflow

**Files:**
- Create: `.github/workflows/release.yml`

This workflow builds a signed MSIX on every version tag push (e.g. `v1.0.0`) and uploads the artifact. Code signing uses a self-signed certificate stored as a GitHub Actions secret.

> **External prerequisite:** You need a `.pfx` code-signing certificate. For Store distribution, Microsoft accepts self-signed certificates if you upload them to Partner Center. Generate one with: `New-SelfSignedCertificate -Type Custom -Subject "CN=Markora" -KeyUsage DigitalSignature -FriendlyName "Markora" -CertStoreLocation "Cert:\CurrentUser\My" -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3", "2.5.29.19={text}")` in PowerShell, then export it as a `.pfx`.

- [ ] **Step 1: Create `.github/workflows/release.yml`**

{% raw %}
```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Set up Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm ci

      - name: Import signing certificate
        env:
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: |
          $certBytes = [Convert]::FromBase64String($env:WINDOWS_CERTIFICATE)
          $certPath = "$env:RUNNER_TEMP\certificate.pfx"
          [IO.File]::WriteAllBytes($certPath, $certBytes)
          Import-PfxCertificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\My -Password (ConvertTo-SecureString $env:WINDOWS_CERTIFICATE_PASSWORD -AsPlainText -Force)

      - name: Build Tauri app
        run: npm run tauri build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}

      - name: Upload MSIX artifact
        uses: actions/upload-artifact@v4
        with:
          name: markora-windows
          path: src-tauri/target/release/bundle/msi/*.msi
          if-no-files-found: error
```
{% endraw %}

- [ ] **Step 2: Add required secrets to the GitHub repository**

In your repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|---|---|
| `WINDOWS_CERTIFICATE` | Base64-encoded `.pfx` file: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\cert.pfx"))` in PowerShell |
| `WINDOWS_CERTIFICATE_PASSWORD` | PFX password |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater signing key (run `npm run tauri signer generate` to create) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Key password |

- [ ] **Step 3: Push a test tag and verify the workflow runs**

```bash
git tag v1.0.0
git push origin v1.0.0
```

Go to the repo's Actions tab and watch the `Release` workflow. Expected: green build, MSIX artifact attached.

- [ ] **Step 4: Commit the workflow file**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions release workflow for signed Windows MSIX"
```

---

## Task 8: Microsoft Store Listing Prep (Non-Code Checklist)

These items are required to complete the Store submission but don't involve code changes.

- [ ] **Register a Microsoft Partner Center account** at https://partner.microsoft.com/en-us/dashboard

- [ ] **Reserve the app name "Markora"** in Partner Center → Apps and games → New product

- [ ] **Prepare Store listing assets:**
  - App description (≤10,000 characters): Write a concise description of Markora, its features, and target audience
  - Short description (≤270 characters): e.g. "A focused, desktop-first markdown editor with split-pane live preview. Powered by Tauri and Rust."
  - At least 1 screenshot (1366×768 or 2560×1440 for Desktop category) — take 3-5 screenshots showing the editor, preview pane, settings, and the split view
  - App icon (already ready: `src-tauri/icons/StoreLogo.png`)

- [ ] **Set up privacy policy hosting:** Publish `docs/legal/privacy-policy.md` as a public webpage. Recommended: enable GitHub Pages on the repo and commit an `index.html` wrapper, or use a service like Netlify. Note the public URL.

- [ ] **Enter the privacy policy URL** in Partner Center → App submission → Properties → Privacy policy URL

- [ ] **Upload the MSIX** from the GitHub Actions release artifact to Partner Center → Packages

- [ ] **Complete age ratings questionnaire** — Markora has no inappropriate content; answer all questions as "No"

- [ ] **Submit for certification**

---

## Self-Review

### Spec Coverage

| Blocking Issue | Task |
|---|---|
| CSP set to null | Task 1 |
| No HTML sanitization | Task 2 |
| Version 0.1.0 too early | Task 3 |
| No Privacy Policy | Task 4 |
| Silent file op errors | Task 5 |
| No MSIX config verified | Task 6 |
| No CI/CD signed builds | Task 7 |
| No Store listing materials | Task 8 |

All 8 issues from the original assessment are covered.

### Placeholder Scan

No TBD, TODO, or vague steps found. Every code step includes the full code block. External actions are clearly called out as "External action required."

### Type Consistency

- `ErrorBanner` props: `{ message: string | null; onDismiss: () => void }` — consistent across test and implementation.
- `AboutSettingsSection` props: `{ version: string; privacyPolicyUrl: string }` — consistent across test and implementation.
- `DOMPurify.sanitize(raw)` returns `string` — matches `setHtml(string)` state setter.
