# Markora UI Review Follow-Up Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten Markora's current editor UI so the layout feels intentional, the canvas fills the desktop window, and the editor, preview, and controls read as one coherent writing tool.

**Architecture:** Keep all document, file, and markdown-rendering behavior unchanged. Limit this pass to React component structure, CSS tokens, and interaction semantics around the existing editor page so the redesign stays incremental and testable.

**Tech Stack:** Tauri v2 · React · TypeScript · CodeMirror 6 · Zustand · CSS · Vitest

---

## Task 1: Rebuild the top bar hierarchy

**Files:**
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.css`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Modify: `src/components/editor-page/document-status/document-status.tsx`
- Modify: `src/components/editor-page/document-status/document-status.css`

**Step 1: Write the failing test**

```tsx
it("keeps document identity separate from utility controls", () => {
  render(
    <TopBar
      fileName="notes.md"
      isDirty
      wordCount={12}
      theme="light"
      onThemeToggle={vi.fn()}
      onNew={vi.fn()}
      onOpen={vi.fn()}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
    />,
  );

  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByTestId("top-bar-document")).toBeInTheDocument();
  expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Bold" })).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL because the current top bar still renders the formatting toolbar and lacks the new structural hooks.

**Step 3: Write minimal implementation**

```tsx
export function TopBar(props: TopBarProps) {
  return (
    <header className="top-bar" role="banner">
      <div className="top-bar__document" data-testid="top-bar-document">
        <DocumentStatus fileName={getDisplayFileName(props.fileName)} isDirty={props.isDirty} />
      </div>
      <div className="top-bar__utilities" data-testid="top-bar-utilities">
        <WordCount value={props.wordCount} />
        <LivePreviewIndicator />
        <ThemeToggle checked={props.theme === "dark"} onCheckedChange={props.onThemeToggle} />
        <FileMenu
          onNew={props.onNew}
          onOpen={props.onOpen}
          onSave={props.onSave}
          onSaveAs={props.onSaveAs}
        />
      </div>
    </header>
  );
}
```

Update `DocumentStatus` so the file name and dirty state stack read as one intentional identity block rather than generic text rows.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.css src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.tsx src/components/editor-page/document-status/document-status.css src/components/editor-page/document-status/document-status.test.tsx
git commit -m "feat: strengthen top bar hierarchy"
```

---

## Task 2: Anchor formatting controls to the editor pane

**Files:**
- Modify: `src/components/editor-page/editor-pane/editor-pane.tsx`
- Modify: `src/components/editor-page/editor-pane/editor-pane.css`
- Modify: `src/components/editor-page/editor-pane/editor-pane.test.tsx`
- Modify: `src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx`
- Modify: `src/components/editor-page/formatting-toolbar/formatting-toolbar.css`
- Modify: `src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders a local editor toolbar above the editing surface", () => {
  const { container } = render(<EditorPane theme="light" />);

  expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
  expect(container.querySelector(".editor-pane__header")).toBeTruthy();
  expect(container.querySelector(".editor-pane__surface")).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx`

Expected: FAIL because the editor pane currently renders only the CodeMirror mount surface.

**Step 3: Write minimal implementation**

```tsx
export function EditorPane({ theme }: EditorPaneProps) {
  return (
    <section className="editor-pane" aria-label="Editor">
      <div className="editor-pane__panel">
        <div className="editor-pane__header">
          <FormattingToolbar
            onBold={() => {}}
            onItalic={() => {}}
            onList={() => {}}
            disabled
          />
        </div>
        <div ref={containerRef} className="editor-pane__surface" />
      </div>
    </section>
  );
}
```

Update `FormattingToolbar` so the toolbar root has `aria-label="Formatting"` and its visual treatment looks attached to the editor instead of floating at page level.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/editor-pane/editor-pane.css src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.css src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx
git commit -m "feat: anchor formatting toolbar to editor pane"
```

---

## Task 3: Make the workspace fill the window and read as a focused canvas

**Files:**
- Modify: `src/app/app-shell/app-shell.css`
- Modify: `src/app/app-shell/app-shell.test.tsx`
- Modify: `src/components/editor-page/workspace/workspace.tsx`
- Modify: `src/components/editor-page/workspace/workspace.css`
- Modify: `src/components/editor-page/workspace/workspace.test.tsx`
- Modify: `src/components/editor-page/preview-pane/preview-pane.tsx`
- Modify: `src/components/editor-page/preview-pane/preview-pane.css`

**Step 1: Write the failing test**

```tsx
it("renders editor and preview panes as named regions", () => {
  render(<Workspace left={<div>Left</div>} right={<div>Right</div>} />);

  expect(screen.getByRole("region", { name: "Editor workspace" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Preview workspace" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/workspace/workspace.test.tsx`

Expected: FAIL because the current panes are anonymous `div`s.

**Step 3: Write minimal implementation**

```tsx
export function Workspace({ left, right }: WorkspaceProps) {
  return (
    <div ref={containerRef} className="workspace" onMouseMove={onMouseMove} onMouseUp={stopDragging} onMouseLeave={stopDragging}>
      <section className="workspace__left" style={{ width: `${splitPct}%` }} aria-label="Editor workspace" role="region">
        {left}
      </section>
      <div
        className="workspace__divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and preview panes"
        tabIndex={0}
        onKeyDown={onDividerKeyDown}
        onMouseDown={startDragging}
      />
      <section className="workspace__right" style={{ width: `${100 - splitPct}%` }} aria-label="Preview workspace" role="region">
        {right}
      </section>
    </div>
  );
}
```

Then update CSS so:
- `app-shell__workspace` stretches edge-to-edge with less wasted lower whitespace
- the workspace gets larger vertical padding only where it improves framing
- the divider has a clearer active and focus-visible state
- preview and editor panels share the same panel rhythm and height behavior

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/app-shell/app-shell.css src/app/app-shell/app-shell.test.tsx src/components/editor-page/workspace/workspace.tsx src/components/editor-page/workspace/workspace.css src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/preview-pane/preview-pane.tsx src/components/editor-page/preview-pane/preview-pane.css
git commit -m "feat: make workspace fill the desktop canvas"
```

---

## Task 4: Tighten the visual system so editor and preview feel like one product

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/globals.css`
- Modify: `src/styles/prose.css`
- Modify: `src/components/editor-page/top-bar/top-bar.css`
- Modify: `src/components/editor-page/editor-pane/editor-pane.css`
- Modify: `src/components/editor-page/preview-pane/preview-pane.css`
- Modify: `src/components/shared/word-count/word-count.css`
- Modify: `src/components/shared/live-preview-indicator/live-preview-indicator.css`
- Modify: `src/components/shared/file-menu/file-menu.css`
- Modify: `src/components/shared/theme-toggle/theme-toggle.css`

**Step 1: Write the failing test**

```tsx
it("keeps utility copy visible alongside document metadata", () => {
  render(
    <TopBar
      fileName="notes.md"
      isDirty
      wordCount={120}
      theme="light"
      onThemeToggle={vi.fn()}
      onNew={vi.fn()}
      onOpen={vi.fn()}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
    />,
  );

  expect(screen.getByText("120 words")).toBeVisible();
  expect(screen.getByText("Live Preview")).toBeVisible();
  expect(screen.getByRole("button", { name: "File actions" })).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL if any markup changes during Tasks 1-3 have hidden or removed utility affordances.

**Step 3: Write minimal implementation**

Use this task to refresh tokens and CSS only:

```css
:root {
  --surface-base: #eef2f4;
  --surface-panel: rgba(255, 255, 255, 0.82);
  --surface-panel-strong: rgba(255, 255, 255, 0.94);
  --surface-editor: #f9fbfc;
  --surface-preview: #fffdf9;
  --accent: #2d5b86;
  --accent-strong: #183b5a;
  --text-primary: #16202a;
  --text-secondary: #53606d;
  --text-muted: #7c8894;
}
```

Refine styles so:
- top bar contrast and grouping are clearer
- editor typography looks more deliberate and less raw than the current state
- preview typography remains strong but visually related to the editor pane
- hover, focus-visible, and active states are stronger than rest states
- no component uses `transition: all`

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/globals.css src/styles/prose.css src/components/editor-page/top-bar/top-bar.css src/components/editor-page/editor-pane/editor-pane.css src/components/editor-page/preview-pane/preview-pane.css src/components/shared/word-count/word-count.css src/components/shared/live-preview-indicator/live-preview-indicator.css src/components/shared/file-menu/file-menu.css src/components/shared/theme-toggle/theme-toggle.css
git commit -m "feat: unify editor page visual system"
```

---

## Task 5: Verify behavior, polish edge cases, and document QA

**Files:**
- Modify: `docs/plans/2026-03-27-markora-ui-review-followup.md`

**Step 1: Run the focused frontend test suite**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx src/components/editor-page/workspace/workspace.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`

Expected: PASS

**Step 2: Run the TypeScript check**

Run: `npx tsc --noEmit`

Expected: PASS

**Step 3: Run the app for manual UI QA**

Run: `npm run tauri dev`

Expected:
- top bar reads clearly at a glance
- formatting controls feel attached to the editor
- panes fill the window with minimal dead space
- divider is keyboard- and mouse-usable
- light and dark themes still look intentional

**Step 4: Record final QA notes in this plan**

```md
## QA Notes

- [ ] `npx vitest run ...`
- [ ] `npx tsc --noEmit`
- [ ] `npm run tauri dev`
- [ ] Light theme checked
- [ ] Dark theme checked
- [ ] Divider keyboard interaction checked
- [ ] Unsaved state still visible
```

**Step 5: Commit**

```bash
git add docs/plans/2026-03-27-markora-ui-review-followup.md
git commit -m "docs: record ui review follow-up qa checklist"
```

## QA Notes

- [x] `npx vitest run`
- [x] `npx tsc --noEmit`
- [ ] `npm run tauri dev`
- [ ] Light theme checked in running app
- [ ] Dark theme checked in running app
- [ ] Divider keyboard interaction checked in running app
- [ ] Unsaved state checked in running app
