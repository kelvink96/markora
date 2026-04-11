# Markora Notepad Markdown Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework Markora into a file-system-first Windows markdown editor with Notepad-style tabs, a two-row command shell, always-visible markdown tools, and switchable `Edit` / `Split` / `Preview` modes while keeping markdown text as the source of truth.

**Architecture:** Keep CodeMirror as the markdown source editor and Rust markdown rendering as the preview engine. Add a document-tab layer and a view-mode layer in the React shell, then restructure the top chrome into a tab strip plus a command row. `Preview` mode remains markdown-first by editing the source column and propagating changes into the rendered pane.

**Tech Stack:** React 19, TypeScript, Zustand, CodeMirror 6, Tauri v2, Rust markdown commands, Vitest, Tailwind v4

---

### Task 1: Establish Shell State For Tabs And View Modes

**Files:**
- Modify: `D:\works\design-sparx\markora\src\store\document.ts`
- Modify: `D:\works\design-sparx\markora\src\store\document.test.ts`
- Create: `D:\works\design-sparx\markora\src\features\workspace\workspace-state.ts`
- Create: `D:\works\design-sparx\markora\src\features\workspace\workspace-state.test.ts`

**Step 1: Write the failing tests**

Add tests that define:
- multiple open documents tracked as tabs
- active tab switching
- untitled tab creation
- closable tabs with dirty-state preservation rules
- `Edit | Split | Preview` persisted as workspace view state

Example test shape:

```ts
it("switches the active view mode", () => {
  const { setViewMode } = useWorkspaceState.getState();
  setViewMode("preview");
  expect(useWorkspaceState.getState().viewMode).toBe("preview");
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/store/document.test.ts src/features/workspace/workspace-state.test.ts
```

Expected: FAIL because tabbed document behavior and workspace view state do not exist yet.

**Step 3: Write minimal implementation**

Implement:
- a `WorkspaceState` store for `viewMode`
- document-tab state for open files and active document
- minimal helper actions for add/select/close tabs

Keep source-of-truth markdown content in the existing document domain; do not introduce a database or non-file document model.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/store/document.test.ts src/features/workspace/workspace-state.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/store/document.ts src/store/document.test.ts src/features/workspace/workspace-state.ts src/features/workspace/workspace-state.test.ts
git commit -m "feat: add tab and view mode state"
```

### Task 2: Build The Tab Strip Row

**Files:**
- Create: `D:\works\design-sparx\markora\src\components\editor-page\tab-strip\tab-strip.tsx`
- Create: `D:\works\design-sparx\markora\src\components\editor-page\tab-strip\tab-strip.test.tsx`
- Create: `D:\works\design-sparx\markora\src\components\editor-page\tab-strip\index.ts`
- Modify: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.tsx`
- Modify: `D:\works\design-sparx\markora\src\app\app-shell\app-shell.test.tsx`

**Step 1: Write the failing tests**

Add tests that require:
- a dedicated top tab row above the command row
- tabs render filenames like Notepad
- active tab is visually distinct
- a `+` action exists for a new tab
- close affordances exist on open tabs

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx src/app/app-shell/app-shell.test.tsx
```

Expected: FAIL because the shell has only one header row and no tab strip component.

**Step 3: Write minimal implementation**

Implement a top `TabStrip` row with:
- horizontally scrollable tabs
- active tab styling
- new-tab button
- close button on tabs

Update `AppShell` to accept `tabStrip`, `commandBar`, `workspace`, and `statusBar` slots.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx src/app/app-shell/app-shell.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/tab-strip src/app/app-shell/app-shell.tsx src/app/app-shell/app-shell.test.tsx
git commit -m "feat: add notepad-style tab strip"
```

### Task 3: Replace The Current Header With A Two-Row Command Shell

**Files:**
- Modify: `D:\works\design-sparx\markora\src\App.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\top-bar\top-bar.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\top-bar\top-bar.test.tsx`
- Modify: `D:\works\design-sparx\markora\src\styles\tailwind.css`

**Step 1: Write the failing tests**

Add expectations that:
- the command row no longer carries document identity as the primary center element
- the markdown toolbar is always visible
- the right side contains a mode switcher and settings
- the command row remains pinned while the body scrolls

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/app/app-shell/app-shell.test.tsx
```

Expected: FAIL because the current top bar does not contain a mode switcher or a full markdown toolbar.

**Step 3: Write minimal implementation**

Refactor the command row into:
- left: `File / Edit / View` menus
- center: markdown toolbar
- right: view mode switcher + settings

Keep the command row always visible in all modes.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/app/app-shell/app-shell.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/styles/tailwind.css
git commit -m "feat: add two-row editor shell"
```

### Task 4: Expand The Markdown Toolbar Into A Real Always-Visible Editing Bar

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\formatting-toolbar\formatting-toolbar.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\formatting-toolbar\formatting-toolbar.test.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\icon-button\icon-button.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\toolbar-group\toolbar-group.tsx`

**Step 1: Write the failing tests**

Add coverage for:
- heading controls
- bold, italic, strikethrough
- bullet, numbered, and task lists
- quote, code block, link, and table actions
- toolbar visibility in all view modes

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx
```

Expected: FAIL because only `Bold`, `Italic`, and `List` exist.

**Step 3: Write minimal implementation**

Expand the toolbar UI first. Keep actions simple by inserting markdown syntax into the active CodeMirror document rather than introducing rich text behavior.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/formatting-toolbar src/components/shared/icon-button src/components/shared/toolbar-group
git commit -m "feat: expand markdown toolbar"
```

### Task 5: Implement Edit, Split, And Preview Layout Modes

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\workspace\workspace.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\workspace\workspace.test.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\editor-pane\editor-pane.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\preview-pane\preview-pane.tsx`
- Modify: `D:\works\design-sparx\markora\src\styles\compat.css`

**Step 1: Write the failing tests**

Add layout tests for:
- `Edit`: editor only
- `Split`: editor left, preview right
- `Preview`: preview dominant left, narrow editable source right
- pinned chrome with scrolling only in body

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: FAIL because the app currently assumes one split layout.

**Step 3: Write minimal implementation**

Drive `Workspace` from `viewMode`:
- `edit`: render only `EditorPane`
- `split`: balanced columns
- `preview`: preview left and a narrower source editor on the right

Do not change source-of-truth editing; only change composition and proportions.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/workspace src/components/editor-page/editor-pane src/components/editor-page/preview-pane src/styles/compat.css
git commit -m "feat: add switchable editor view modes"
```

### Task 6: Wire Tabs Into File Operations

**Files:**
- Modify: `D:\works\design-sparx\markora\src\App.tsx`
- Modify: `D:\works\design-sparx\markora\src\features\document\document-actions.ts`
- Modify: `D:\works\design-sparx\markora\src\features\document\document-actions.test.ts`
- Modify: `D:\works\design-sparx\markora\src\store\document.ts`
- Modify: `D:\works\design-sparx\markora\src\store\document.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- opening multiple files as separate tabs
- creating multiple untitled tabs
- save/save-as acting on the active tab
- per-tab dirty status
- document title updating when tabs switch

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/store/document.test.ts src/features/document/document-actions.test.ts
```

Expected: FAIL because save/open/new are currently single-document flows.

**Step 3: Write minimal implementation**

Refactor `App.tsx` and store calls to operate on the active tab/document. Preserve Rust file reads/writes; do not move file I/O into the browser.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/store/document.test.ts src/features/document/document-actions.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/features/document/document-actions.ts src/features/document/document-actions.test.ts src/store/document.ts src/store/document.test.ts
git commit -m "feat: support file tabs in app workflow"
```

### Task 7: Upgrade Footer Status For Editor Context

**Files:**
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\footer-status-bar\footer-status-bar.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\editor-page\footer-status-bar\footer-status-bar.test.tsx`
- Modify: `D:\works\design-sparx\markora\src\components\shared\word-count\word-count.tsx`

**Step 1: Write the failing tests**

Add expectations for:
- word count
- line and column
- active mode label
- file type or markdown status

**Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx
```

Expected: FAIL because the footer currently shows only a label and word count.

**Step 3: Write minimal implementation**

Add editor-context information without turning the footer into a dashboard. Keep it quiet, compact, and desktop-native.

**Step 4: Run tests to verify they pass**

Run:

```bash
npx vitest run src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/footer-status-bar src/components/shared/word-count
git commit -m "feat: enrich footer editor status"
```

### Task 8: Final Integration, Styling Pass, And Verification

**Files:**
- Modify: `D:\works\design-sparx\markora\src\styles\tailwind.css`
- Modify: `D:\works\design-sparx\markora\src\styles\compat.css`
- Modify: `D:\works\design-sparx\markora\src\App.tsx`

**Step 1: Run the focused test suite**

Run:

```bash
npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/tab-strip/tab-strip.test.tsx src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx src/store/document.test.ts src/features/workspace/workspace-state.test.ts
```

Expected: PASS

**Step 2: Run TypeScript verification**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

**Step 3: Run app-level visual verification**

Run:

```bash
npm run dev
```

Check:
- tabs behave like Notepad
- command row stays pinned
- toolbar is always visible
- mode switcher updates layout correctly
- `Preview` mode shows preview left and narrow source right
- footer remains visible

**Step 4: Commit**

```bash
git add src/App.tsx src/styles/tailwind.css src/styles/compat.css
git commit -m "feat: finalize markdown editor shell redesign"
```
