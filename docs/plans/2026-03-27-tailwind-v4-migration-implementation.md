# Tailwind v4 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Markora's frontend CSS architecture with Tailwind CSS v4 while preserving current layout, theme behavior, Radix integration, CodeMirror rendering, and markdown preview behavior.

**Architecture:** Tailwind v4 becomes the primary UI styling system through the Vite plugin and a single app-level stylesheet. Component-specific `.css` files are removed as TSX components adopt utility classes. A small compatibility stylesheet remains for root theme variables, CodeMirror selectors, and rendered markdown descendants that are not practical to express purely in component markup.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, Radix UI primitives, CodeMirror 6, Zustand, Vitest, Tauri v2

---

### Task 1: Add Tailwind v4 Tooling

**Files:**
- Modify: `D:\works\design-sparx\markora\package.json`
- Modify: `D:\works\design-sparx\markora\vite.config.ts`
- Create: `D:\works\design-sparx\markora\src\styles\tailwind.css`
- Modify: `D:\works\design-sparx\markora\src\main.tsx`

**Step 1: Write the failing test**

Add a build-safety assertion by first running the current type/build pipeline after introducing the new import path in `src/main.tsx` and before installing Tailwind. The expected failure is a missing module or stylesheet reference.

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL because the new Tailwind stylesheet or plugin dependency is not wired yet.

**Step 3: Write minimal implementation**

- Add `tailwindcss` and `@tailwindcss/vite` to `devDependencies`
- Update `vite.config.ts` plugin list from `plugins: [react()]` to `plugins: [react(), tailwindcss()]`
- Create `src/styles/tailwind.css` with the Tailwind v4 import and placeholder theme layer
- Replace the current style imports in `src/main.tsx` so the app imports `./styles/tailwind.css`

Starter stylesheet:

```css
@import "tailwindcss";

@theme inline {
  --color-app-bg: var(--surface-base);
  --color-app-panel: var(--surface-panel);
  --color-app-panel-strong: var(--surface-panel-strong);
  --color-app-subtle: var(--surface-subtle);
  --color-app-editor: var(--surface-editor);
  --color-app-preview: var(--surface-preview);
  --color-app-text: var(--text-primary);
  --color-app-text-secondary: var(--text-secondary);
  --color-app-text-muted: var(--text-muted);
  --color-app-accent: var(--accent);
  --color-app-accent-strong: var(--accent-strong);
  --radius-app-sm: var(--radius-sm);
  --radius-app-md: var(--radius-md);
  --radius-app-lg: var(--radius-lg);
  --font-ui: var(--font-ui);
  --font-editor: var(--font-editor);
  --font-prose: var(--font-prose);
}
```

**Step 4: Run test to verify it passes**

Run: `npm install`
Run: `npm run build`
Expected: PASS with Tailwind integrated and no unresolved imports.

**Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/main.tsx src/styles/tailwind.css
git commit -m "build: add tailwind v4 tooling"
```

### Task 2: Consolidate Global Tokens And Theme Root

**Files:**
- Modify: `D:\works\design-sparx\markora\src\styles\tailwind.css`
- Delete: `D:\works\design-sparx\markora\src\styles\globals.css`
- Delete: `D:\works\design-sparx\markora\src\styles\tokens.css`
- Delete: `D:\works\design-sparx\markora\src\styles\app.css`
- Test: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.test.tsx`

**Step 1: Write the failing test**

Extend `app-shell.test.tsx` so it asserts that:

- the top-level shell is rendered
- the light theme does not apply the dark theme class
- the dark theme does apply the dark theme class

Example assertion shape:

```tsx
const { rerender } = render(
  <AppShell theme="light" topBar={<div>Top</div>} workspace={<div>Body</div>} />,
);

expect(screen.getByTestId("app-shell")).not.toHaveClass("theme-dark");

rerender(
  <AppShell theme="dark" topBar={<div>Top</div>} workspace={<div>Body</div>} />,
);

expect(screen.getByTestId("app-shell")).toHaveClass("theme-dark");
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`
Expected: FAIL because `AppShell` does not yet expose a stable test id and the theme root structure is not tightened for the migration.

**Step 3: Write minimal implementation**

- Move the active token variables from `src/styles/tokens.css` into `src/styles/tailwind.css`
- Move global reset and body/root sizing rules from `src/styles/globals.css` into `src/styles/tailwind.css`
- Remove legacy and duplicated declarations from `src/styles/app.css`
- Add a stable `data-testid="app-shell"` to `AppShell`
- Keep the existing `theme-dark` root class so current Zustand theme behavior continues to work

Suggested root structure:

```tsx
<div
  data-testid="app-shell"
  className={`min-h-screen bg-app-bg font-[var(--font-ui)] text-app-text ${theme === "dark" ? "theme-dark" : ""}`}
>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`
Run: `npx tsc --noEmit`
Expected: PASS with the theme root consolidated into the Tailwind entry stylesheet.

**Step 5: Commit**

```bash
git add src/app/app-shell/app-shell.tsx src/app/app-shell/app-shell.test.tsx src/styles/tailwind.css
git rm src/styles/globals.css src/styles/tokens.css src/styles/app.css
git commit -m "refactor: consolidate global theme styles for tailwind"
```

### Task 3: Create The Compatibility Layer For CodeMirror And Preview HTML

**Files:**
- Create: `D:\works\design-sparx\markora\src\styles\compat.css`
- Modify: `D:\works\design-sparx\markora\src\main.tsx`
- Test: `D:\works\design-sparx\markora\src\components\editor-page\editor-pane\editor-pane.test.tsx`
- Test: `D:\works\design-sparx\markora\src\components\editor-page\preview-pane\preview-pane.test.tsx`

**Step 1: Write the failing test**

Update tests to assert on stable semantic containers instead of legacy BEM class names:

- `EditorPane` should expose an `aria-label="Editor"` section and a test id for the CodeMirror mount surface
- `PreviewPane` should expose an `aria-label="Preview"` section and a test id for the HTML content container

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Expected: FAIL because those stable hooks do not exist yet.

**Step 3: Write minimal implementation**

Create `src/styles/compat.css` for:

- `.cm-editor`, `.cm-scroller`, and `.cm-content`
- light/dark editor surface treatment
- `.prose` descendant styling for headings, paragraphs, code, tables, lists, and images

Import order in `src/main.tsx`:

```tsx
import "./styles/tailwind.css";
import "./styles/compat.css";
```

Keep the compatibility file intentionally small and only selector-based where markup is not authored directly by React.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Expected: PASS with stable test hooks and no dependence on removed CSS file names.

**Step 5: Commit**

```bash
git add src/main.tsx src/styles/compat.css src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx
git commit -m "refactor: add compatibility styles for editor and preview"
```

### Task 4: Migrate Shared UI Primitives To Tailwind Utilities

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\shared\icon-button\icon-button.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\menu-bar\menu-bar.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\theme-toggle\theme-toggle.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\toolbar-group\toolbar-group.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\live-preview-indicator\live-preview-indicator.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\word-count\word-count.tsx`
- Delete: `D:\works\design-sparx\markora\src\components\shared\icon-button\icon-button.css`
- Delete: `D:\works\design-sparx\markora\src\components\shared\menu-bar\menu-bar.css`
- Delete: `D:\works\design-sparx\markora\src\components\shared\theme-toggle\theme-toggle.css`
- Delete: `D:\works\design-sparx\markora\src\components\shared\toolbar-group\toolbar-group.css`
- Delete: `D:\works\design-sparx\markora\src\components\shared\live-preview-indicator\live-preview-indicator.css`
- Delete: `D:\works\design-sparx\markora\src\components\shared\word-count\word-count.css`
- Test: the matching `*.test.tsx` files for the shared components

**Step 1: Write the failing test**

For each shared component test file, replace any direct dependency on removed CSS class names with semantic assertions:

- menu trigger and menu item roles
- tooltip label presence
- switch/button accessibility labels
- indicator text content

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared`
Expected: FAIL where tests still depend on legacy classes or component markup before Tailwind migration.

**Step 3: Write minimal implementation**

- Remove each local CSS import
- Inline Tailwind utility classes directly on the JSX
- Use Radix `data-*` attributes for open/closed states where styling depends on interaction state
- Preserve visible behavior and hit area, not necessarily identical class names

Example pattern:

```tsx
<button
  className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-black/10 bg-app-panel px-3 text-sm text-app-text transition hover:border-app-accent hover:text-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40 disabled:opacity-50"
  type="button"
>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared`
Run: `npx tsc --noEmit`
Expected: PASS with shared primitives now styled through Tailwind utilities.

**Step 5: Commit**

```bash
git add src/components/shared
git commit -m "refactor: migrate shared ui primitives to tailwind"
```

### Task 5: Migrate Top Bar And Document Status Components

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\top-bar\top-bar.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\document-status\document-status.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\formatting-toolbar\formatting-toolbar.tsx`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\top-bar\top-bar.css`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\document-status\document-status.css`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\formatting-toolbar\formatting-toolbar.css`
- Test: matching `*.test.tsx` files

**Step 1: Write the failing test**

Add or update tests so they assert:

- the top bar still exposes new/open/save actions
- the theme toggle is reachable by accessible name
- document dirty state still renders visibly
- the formatting toolbar remains labeled `"Formatting"`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar src/components/editor-page/document-status src/components/editor-page/formatting-toolbar`
Expected: FAIL where class-bound structure has changed or new accessibility hooks are not yet present.

**Step 3: Write minimal implementation**

- Replace layout and spacing classes with Tailwind utilities
- Preserve the desktop-first top bar density
- Keep the current grouping and action ordering
- Style Radix dropdowns and separators through utility classes and `data-*` selectors instead of component CSS

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar src/components/editor-page/document-status src/components/editor-page/formatting-toolbar`
Expected: PASS with the top control surface fully migrated.

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar src/components/editor-page/document-status src/components/editor-page/formatting-toolbar
git commit -m "refactor: migrate editor chrome to tailwind"
```

### Task 6: Migrate App Shell And Split Workspace Layout

**Files:**
- Modify: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\workspace\workspace.tsx`
- Delete: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.css`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\workspace\workspace.css`
- Test: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.test.tsx`
- Test: `D:\works\design-sparx\markora\src\components\editor-page\workspace\workspace.test.tsx`

**Step 1: Write the failing test**

Refactor `workspace.test.tsx` so it asserts:

- both named regions still exist
- the separator is keyboard accessible
- pane widths still change after arrow key input

Avoid asserting on `.workspace__divider`; prefer `getByRole("separator", { name: ... })`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/workspace/workspace.test.tsx`
Expected: FAIL because legacy class selectors are removed before Tailwind layout classes are in place.

**Step 3: Write minimal implementation**

- Remove CSS imports from `AppShell` and `Workspace`
- Inline the flex layout, height behavior, divider appearance, and pane overflow rules as Tailwind classes
- Keep pane widths driven by inline `style={{ width: ... }}` because split percentages are dynamic runtime values

Suggested divider shape:

```tsx
<div
  className="w-2 shrink-0 cursor-col-resize bg-black/8 transition hover:bg-app-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40"
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize editor and preview panes"
  tabIndex={0}
/>
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/workspace/workspace.test.tsx`
Expected: PASS with split-pane layout behavior intact.

**Step 5: Commit**

```bash
git add src/app/app-shell src/components/editor-page/workspace
git commit -m "refactor: migrate app shell and workspace layout to tailwind"
```

### Task 7: Migrate Editor Pane And Preview Pane Containers

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\editor-pane\editor-pane.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\preview-pane\preview-pane.tsx`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\editor-pane\editor-pane.css`
- Delete: `D:\works\design-sparx\markora\src\components\editor-page\preview-pane\preview-pane.css`
- Test: `D:\works\design-sparx\markora\src\components\editor-page\editor-pane\editor-pane.test.tsx`
- Test: `D:\works\design-sparx\markora\src\components\editor-page\preview-pane\preview-pane.test.tsx`

**Step 1: Write the failing test**

Update the pane tests to assert on:

- the editor section and toolbar label
- a stable editor surface test id such as `editor-surface`
- the preview section and a stable preview content test id such as `preview-content`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Expected: FAIL until the migrated markup exposes the new hooks.

**Step 3: Write minimal implementation**

- Remove local CSS imports
- Apply Tailwind classes for pane wrapper, panel shell, header spacing, rounded corners, borders, background, and overflow
- Leave CodeMirror descendant styling in `compat.css`
- Keep the rendered markdown container using `className="prose"` or an equivalent stable prose hook so the compatibility file can style the generated HTML

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Run: `npm run build`
Expected: PASS with editor and preview containers migrated and still compiling in production mode.

**Step 5: Commit**

```bash
git add src/components/editor-page/editor-pane src/components/editor-page/preview-pane
git commit -m "refactor: migrate editor and preview panes to tailwind"
```

### Task 8: Remove Remaining CSS Imports And Verify Full Cutover

**Files:**
- Modify: `D:\works\design-sparx\markora\src\App.tsx` only if test hooks or wrapper props changed during migration
- Delete: any remaining component `.css` files under `D:\works\design-sparx\markora\src\app\` and `D:\works\design-sparx\markora\src\components\` that are no longer imported
- Test: all frontend test files under `D:\works\design-sparx\markora\src\`

**Step 1: Write the failing test**

Add one guard check to ensure no component-scoped CSS imports remain in TSX files. This can be a shell verification step in CI rather than a Vitest test.

Example command:

```bash
rg "\.css\";" src
```

Expected final result: only `src/main.tsx` imports `tailwind.css` and `compat.css`.

**Step 2: Run test to verify it fails**

Run: `rg "\.css\";" src`
Expected: FAIL with matches across migrated component files before cleanup is complete.

**Step 3: Write minimal implementation**

- Remove leftover component CSS imports
- Delete obsolete CSS files
- Make sure only `src/styles/tailwind.css` and `src/styles/compat.css` remain as frontend stylesheet entry points
- Check `App.tsx` only for any fallout from changed component hooks or props, not for design changes

**Step 4: Run test to verify it passes**

Run: `rg "\.css\";" src`
Expected: only `src/main.tsx` matches

Run: `npx vitest run`
Run: `npx tsc --noEmit`
Run: `npm run build`
Expected: PASS across the full frontend suite

**Step 5: Commit**

```bash
git add src
git commit -m "refactor: complete tailwind v4 migration"
```

### Task 9: Manual Desktop Verification In Tauri

**Files:**
- No code changes required unless regressions are found

**Step 1: Write the failing test**

Define a manual checklist before launch:

- top bar renders correctly
- menus open and remain readable in both themes
- theme toggle updates shell, editor, and preview
- split divider drags and responds to keyboard controls
- editor fills its pane and wraps lines correctly
- preview markdown typography remains readable

**Step 2: Run test to verify it fails**

Run: `npm run tauri dev`
Expected: use this as a manual regression pass. Any visual or interaction regression counts as failure and should be fixed before sign-off.

**Step 3: Write minimal implementation**

Fix only regressions found during manual verification. Prefer adjusting Tailwind utility classes or the compatibility stylesheet over adding new component-scoped CSS files.

**Step 4: Run test to verify it passes**

Run: `npm run tauri dev`
Expected: PASS on the manual checklist in both light and dark themes.

**Step 5: Commit**

```bash
git add src
git commit -m "test: verify tailwind migration in tauri shell"
```
