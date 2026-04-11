# Markora Precision Dark Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the approved Precision Dark redesign so Markora feels like a bespoke pro desktop writing tool while preserving the current split-pane markdown workflow.

**Architecture:** This pass stays inside the current React and Tailwind UI layer. We will update shared design tokens in the Tailwind stylesheet, then refine the app shell, top bar, workspace, and pane components so the document remains primary and the chrome becomes tighter and calmer. Tests stay front-loaded so each visual contract is verified before implementation.

**Tech Stack:** React, TypeScript, Tailwind v4, Vitest, Testing Library, Tauri v2, Zustand, CodeMirror 6

---

### Task 1: Lock the Precision Dark token system

**Files:**
- Modify: `D:/works/design-sparx/markora/src/styles/tailwind.css`
- Test: `D:/works/design-sparx/markora/src/app/app-shell/app-shell.test.tsx`

**Step 1: Write the failing test**

Add assertions in `D:/works/design-sparx/markora/src/app/app-shell/app-shell.test.tsx` that the shell exposes the updated productivity-oriented chrome classes you expect after the redesign, such as a darker shell surface and the refined shell framing hook.

```tsx
expect(shell).toHaveClass("bg-app-bg");
expect(shell).toHaveClass("text-app-text");
expect(shell).toHaveClass("antialiased");
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`

Expected: FAIL because the new shell classes or hooks are not present yet.

**Step 3: Write minimal implementation**

Update `D:/works/design-sparx/markora/src/styles/tailwind.css` to introduce the approved `Precision Dark` token set:

- compress the dark palette into narrower tonal steps
- define calmer panel/background separation
- tune border, shadow, radius, and spacing tokens toward a precision desktop feel
- keep light theme functional, but prioritize the pro dark theme

Also update `D:/works/design-sparx/markora/src/app/app-shell/app-shell.tsx` if needed so the shell consumes any new token-driven classes added in the test.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/styles/tailwind.css src/app/app-shell/app-shell.tsx src/app/app-shell/app-shell.test.tsx
git commit -m "feat: tighten precision dark shell tokens"
```

### Task 2: Rebuild the top bar into a compact command rail

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/menu-bar/menu-bar.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/live-preview-indicator/live-preview-indicator.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/word-count/word-count.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/document-status/document-status.tsx`
- Test: `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.test.tsx`

**Step 1: Write the failing test**

Expand `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.test.tsx` so it verifies the approved command-rail structure:

- tighter banner spacing
- inset center action cluster
- distinct document, command, and utility zones
- compact utility strip treatment

```tsx
expect(screen.getByRole("banner")).toHaveClass("px-3", "py-2");
expect(screen.getByTestId("top-bar-menu")).toHaveClass("rounded-[var(--radius-md)]");
expect(screen.getByTestId("top-bar-utilities")).toHaveClass("gap-1.5");
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL because the top bar still uses the previous toolbar styling contract.

**Step 3: Write minimal implementation**

Update the top bar and related shared controls to match the approved design:

- reduce perceived top-bar height
- make the center rail feel like a productized command cluster
- quiet the utility strip so it behaves like telemetry, not primary chrome
- keep file identity prominent on the left
- refine menu trigger and dropdown styling to feel denser and more controlled

Use `@test-driven-development` discipline and avoid introducing unrelated toolbar actions.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/shared/menu-bar/menu-bar.tsx src/components/shared/live-preview-indicator/live-preview-indicator.tsx src/components/shared/word-count/word-count.tsx src/components/editor-page/document-status/document-status.tsx
git commit -m "feat: refine precision dark top bar"
```

### Task 3: Rebalance the workspace and divider treatment

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/workspace/workspace.tsx`
- Test: `D:/works/design-sparx/markora/src/components/editor-page/workspace/workspace.test.tsx`

**Step 1: Write the failing test**

Update `D:/works/design-sparx/markora/src/components/editor-page/workspace/workspace.test.tsx` so it captures the new workspace contract:

- tighter outer spacing rhythm
- calmer gap treatment
- refined divider affordance
- preserved keyboard resizing behavior

```tsx
expect(workspace).toHaveClass("gap-2");
expect(workspace).toHaveClass("px-3");
expect(screen.getByRole("separator", { name: "Resize editor and preview panes" })).toHaveClass("rounded-[999px]");
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/workspace/workspace.test.tsx`

Expected: FAIL because the workspace still exposes the previous spacing and divider classes.

**Step 3: Write minimal implementation**

Adjust `D:/works/design-sparx/markora/src/components/editor-page/workspace/workspace.tsx` to express the approved shell:

- tighten workspace padding
- reduce visual looseness between panes
- refine the divider to feel understated at rest and clearer on hover/focus
- preserve existing width clamping and keyboard behavior

Do not change the core split-pane interaction model.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/workspace/workspace.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/workspace/workspace.tsx src/components/editor-page/workspace/workspace.test.tsx
git commit -m "feat: tighten precision dark workspace framing"
```

### Task 4: Give the editor and preview distinct but cohesive panel identities

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx`
- Test: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.test.tsx`
- Test: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.test.tsx`

**Step 1: Write the failing tests**

Update both pane tests so they assert the new precision-panel contract:

- editor panel has stronger presence and integrated header rail
- preview panel feels slightly more recessed
- surface padding, radius, and border treatment match the redesign

```tsx
expect(screen.getByRole("region", { name: "Editor" })).toHaveClass("pb-0");
expect(screen.getByTestId("editor-surface")).toHaveClass("bg-app-editor");
expect(screen.getByTestId("preview-content")).toHaveClass("max-w-[44rem]");
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`

Expected: FAIL because the old panel contracts are still in place.

**Step 3: Write minimal implementation**

Update the pane components to reflect the approved hierarchy:

- editor surface becomes the stronger work surface
- preview remains cohesive but slightly calmer
- pane chrome becomes more compact and precise
- formatting toolbar fits the new embedded-rail treatment

Preserve current accessibility labels and Tauri/Rust integration points.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx
git commit -m "feat: rebalance precision dark editor surfaces"
```

### Task 5: Run regression checks for the redesign pass

**Files:**
- Verify only: `D:/works/design-sparx/markora/src/app/app-shell/app-shell.test.tsx`
- Verify only: `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.test.tsx`
- Verify only: `D:/works/design-sparx/markora/src/components/editor-page/workspace/workspace.test.tsx`
- Verify only: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.test.tsx`
- Verify only: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.test.tsx`

**Step 1: Run the focused UI test suite**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`

Expected: PASS

**Step 2: Run the type check**

Run: `npx tsc --noEmit`

Expected: PASS

**Step 3: Smoke-test the desktop UI manually**

Run: `npm run tauri dev`

Expected:

- shell feels darker and calmer
- top bar reads as a command rail
- editor clearly leads the workspace
- divider and control states feel more precise

**Step 4: Commit the verification pass if any polish fixes were needed**

```bash
git add src
git commit -m "test: verify precision dark redesign"
```

## Notes

- The current worktree already contains ongoing UI edits in the same files. Before implementing, review the existing diffs carefully and layer this plan on top of them rather than reverting them.
- Keep Rust markdown parsing and file I/O unchanged for this redesign.
- Stay inside YAGNI: this plan is about shell quality, not new product behavior.
