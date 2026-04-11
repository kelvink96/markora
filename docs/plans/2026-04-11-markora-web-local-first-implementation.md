# Markora Web Local-First Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based local-first version of Markora with multi-project workspaces, live preview, and real file access where supported.

**Architecture:** Introduce platform adapters so the React app shell can run in both desktop and web contexts. Keep Rust markdown rendering and file I/O for desktop, and add browser adapters for markdown, file access, and local persistence on the web. Expand state management from single-document editing to workspace/project/document state without breaking the existing desktop flow.

**Tech Stack:** React, TypeScript, Zustand, CodeMirror 6, Vite, Vitest, browser File System Access API, IndexedDB, Tauri v2, Rust

---

### Task 1: Inventory the current desktop-only assumptions

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/store/document.ts`
- Review: `src/components/Editor.tsx`
- Review: `src/components/Preview.tsx`
- Review: `src-tauri/src/commands/file.rs`
- Review: `src-tauri/src/commands/markdown.rs`

**Step 1: Write the failing test**

Create a lightweight regression test that documents one desktop-only assumption you intend to break apart first, such as app startup or preview rendering depending directly on Tauri.

**Step 2: Run test to verify it fails**

Run: `npx vitest run`

Expected: a failing test that proves the current shell is too tightly coupled for browser execution.

**Step 3: Write minimal implementation**

Refactor the smallest surface needed to separate UI behavior from direct Tauri calls. Do not add web features yet.

**Step 4: Run test to verify it passes**

Run: `npx vitest run`

Expected: the new regression test passes and existing UI tests still pass.

**Step 5: Commit**

```bash
git add src/App.tsx src/store/document.ts
git commit -m "refactor: isolate desktop-only app shell dependencies"
```

### Task 2: Introduce platform adapter interfaces

**Files:**
- Create: `src/platform/files/types.ts`
- Create: `src/platform/files/desktop.ts`
- Create: `src/platform/files/web.ts`
- Create: `src/platform/markdown/types.ts`
- Create: `src/platform/markdown/desktop.ts`
- Create: `src/platform/markdown/web.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Add tests that expect app code to consume file and markdown capabilities through injectable interfaces rather than direct environment calls.

**Step 2: Run test to verify it fails**

Run: `npx vitest run`

Expected: failures showing the adapter interfaces do not exist yet.

**Step 3: Write minimal implementation**

Define the interfaces and wire the desktop implementations to the existing Tauri behavior. Stub the web implementations enough to compile.

**Step 4: Run test to verify it passes**

Run: `npx vitest run`

Expected: adapter tests pass and desktop behavior remains intact.

**Step 5: Commit**

```bash
git add src/platform src/App.tsx
git commit -m "refactor: add platform adapters for files and markdown"
```

### Task 3: Add browser markdown rendering

**Files:**
- Modify: `package.json`
- Create: `src/platform/markdown/web.ts`
- Create: `src/platform/markdown/web.test.ts`

**Step 1: Write the failing test**

Add tests for browser markdown rendering of headings, emphasis, code blocks, and sanitized HTML output.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/platform/markdown/web.test.ts`

Expected: FAIL because the web renderer does not exist yet.

**Step 3: Write minimal implementation**

Add a browser markdown library and implement a minimal renderer with output sanitization that matches the preview contract used by the app.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/platform/markdown/web.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add package.json package-lock.json src/platform/markdown
git commit -m "feat: add browser markdown renderer"
```

### Task 4: Create a web-capable persistence layer

**Files:**
- Create: `src/platform/persistence/web.ts`
- Create: `src/platform/persistence/web.test.ts`
- Modify: `src/store/document.ts`

**Step 1: Write the failing test**

Add tests for saving and loading workspace metadata and document drafts in a browser-safe persistence layer.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/platform/persistence/web.test.ts`

Expected: FAIL because the persistence layer does not exist yet.

**Step 3: Write minimal implementation**

Implement IndexedDB-backed persistence for workspaces, recents, and draft content, with a simple in-memory fallback for tests.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/platform/persistence/web.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/platform/persistence src/store/document.ts
git commit -m "feat: add browser workspace persistence"
```

### Task 5: Expand Zustand state to workspace/project/document scope

**Files:**
- Modify: `src/store/document.ts`
- Create: `src/store/document.test.ts`

**Step 1: Write the failing test**

Add tests covering:
- multiple projects
- multiple open documents
- recents ordering
- dirty state per document
- switching active project and document

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/document.test.ts`

Expected: FAIL because the store only supports the current single-document model.

**Step 3: Write minimal implementation**

Expand the store carefully to support workspace-aware state while preserving desktop behavior through compatibility helpers where needed.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/document.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/store/document.ts src/store/document.test.ts
git commit -m "feat: add workspace-aware document store"
```

### Task 6: Build the workspace sidebar UI

**Files:**
- Create: `src/components/WorkspaceSidebar.tsx`
- Create: `src/components/WorkspaceSidebar.test.tsx`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Add UI tests for:
- project list rendering
- file list rendering
- changing the active file
- recents visibility

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/WorkspaceSidebar.test.tsx`

Expected: FAIL because the sidebar component does not exist yet.

**Step 3: Write minimal implementation**

Implement a stable editor-first layout with a sidebar that exposes projects, files, and recents without disrupting the existing editor and preview panes.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/WorkspaceSidebar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/WorkspaceSidebar.tsx src/components/WorkspaceSidebar.test.tsx src/App.tsx
git commit -m "feat: add workspace sidebar for web app shell"
```

### Task 7: Enable browser-mode single-document editing

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Preview.tsx`
- Modify: `src/components/Editor.tsx`

**Step 1: Write the failing test**

Add an integration test proving the app can boot in web mode, edit a document, and update preview without Tauri.

**Step 2: Run test to verify it fails**

Run: `npx vitest run`

Expected: FAIL because startup still assumes desktop wiring in some path.

**Step 3: Write minimal implementation**

Wire the new adapters into app startup so the browser app can render and edit a single local document correctly.

**Step 4: Run test to verify it passes**

Run: `npx vitest run`

Expected: the new integration test passes and existing editor tests remain green.

**Step 5: Commit**

```bash
git add src/App.tsx src/components/Editor.tsx src/components/Preview.tsx
git commit -m "feat: enable browser editing mode"
```

### Task 8: Add browser-managed workspaces

**Files:**
- Modify: `src/platform/persistence/web.ts`
- Modify: `src/store/document.ts`
- Modify: `src/App.tsx`
- Create: `src/features/workspaces/browser-workspaces.test.ts`

**Step 1: Write the failing test**

Add tests for creating, persisting, reopening, and switching browser-backed projects and files.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/workspaces/browser-workspaces.test.ts`

Expected: FAIL because browser-backed multi-project workflows are incomplete.

**Step 3: Write minimal implementation**

Implement browser-backed workspace creation, file creation, and recent project restoration.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/workspaces/browser-workspaces.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/platform/persistence/web.ts src/store/document.ts src/App.tsx src/features/workspaces
git commit -m "feat: add browser-backed workspaces"
```

### Task 9: Add File System Access API support

**Files:**
- Modify: `src/platform/files/web.ts`
- Create: `src/platform/files/web.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Add tests for:
- detecting support
- opening a directory handle
- loading markdown files
- saving changes back to disk

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/platform/files/web.test.ts`

Expected: FAIL because filesystem-backed browser workspaces are not implemented.

**Step 3: Write minimal implementation**

Implement File System Access API support behind the web files adapter, with graceful fallback signals when the API is unavailable.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/platform/files/web.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/platform/files/web.ts src/platform/files/web.test.ts src/App.tsx
git commit -m "feat: add browser file system access"
```

### Task 10: Add import/export fallback flows

**Files:**
- Modify: `src/App.tsx`
- Create: `src/features/import-export/import-export.test.ts`

**Step 1: Write the failing test**

Add tests that prove users can import markdown files into browser-backed workspaces and export them back out.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/import-export/import-export.test.ts`

Expected: FAIL because import/export is not implemented yet.

**Step 3: Write minimal implementation**

Add import/export actions and wire them into the web UI so unsupported browsers still have a usable path.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/import-export/import-export.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/features/import-export
git commit -m "feat: add import and export fallback flows"
```

### Task 11: Verify desktop behavior still works

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/store/document.ts`
- Review: `src-tauri/src/commands/file.rs`
- Review: `src-tauri/src/commands/markdown.rs`

**Step 1: Write the failing test**

Add or extend desktop-focused tests that cover opening, editing, preview rendering, and saving through the Tauri path after the shared refactor.

**Step 2: Run test to verify it fails**

Run: `npx vitest run`

Expected: a regression test catches any accidental desktop breakage introduced by the web refactor.

**Step 3: Write minimal implementation**

Patch compatibility gaps without re-entangling the platform boundary.

**Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run
npx tsc --noEmit
cd src-tauri && cargo test
```

Expected: all tests and checks pass.

**Step 5: Commit**

```bash
git add src/App.tsx src/store/document.ts src-tauri/src/commands/file.rs src-tauri/src/commands/markdown.rs
git commit -m "test: verify desktop behavior after web refactor"
```

### Task 12: Document web and desktop capability differences

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Create: `docs/markora-web-capabilities.md`

**Step 1: Write the failing test**

For documentation work, use a checklist instead of an automated test. Confirm the docs do not yet explain:
- browser fallback behavior
- file access support differences
- desktop vs web markdown/rendering expectations

**Step 2: Run test to verify it fails**

Manual verification: the current docs do not cover the new product split.

**Step 3: Write minimal implementation**

Document the web product scope, browser capability fallback, and the continued role of the desktop app.

**Step 4: Run test to verify it passes**

Manual verification: all three topics are now covered.

**Step 5: Commit**

```bash
git add README.md AGENTS.md docs/markora-web-capabilities.md
git commit -m "docs: add markora web capability guidance"
```
