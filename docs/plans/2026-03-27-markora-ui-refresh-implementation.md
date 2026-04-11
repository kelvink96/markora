# Markora UI Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Markora’s main editor screen into a premium, focused writing canvas using Radix Primitives, a stronger visual system, and a scalable component structure.

**Architecture:** Keep the current editor/preview/file-operation behavior intact while refactoring the UI into page-specific and shared components. Use Radix Primitives for accessible interaction behavior only, and implement all visual styling through custom CSS tokens and colocated component styles. Move side-effectful actions to feature-level helpers so presentation components remain focused.

**Tech Stack:** Tauri v2 · React · TypeScript · CodeMirror 6 · Zustand · Radix Primitives · Vite · Vitest

---

## File Map Target

```text
src/
├── app/
│   ├── app-shell/
│   │   ├── app-shell.tsx
│   │   ├── app-shell.test.tsx
│   │   ├── app-shell.css
│   │   └── index.ts
│   └── index.ts
├── components/
│   ├── shared/
│   │   ├── icon-button/
│   │   ├── file-menu/
│   │   ├── theme-toggle/
│   │   ├── live-preview-indicator/
│   │   ├── toolbar-group/
│   │   └── word-count/
│   └── editor-page/
│       ├── top-bar/
│       ├── document-status/
│       ├── formatting-toolbar/
│       ├── editor-pane/
│       ├── preview-pane/
│       └── workspace/
├── features/
│   ├── document/
│   │   ├── document-actions.ts
│   │   └── document-actions.test.ts
│   └── theme/
│       ├── theme-store.ts
│       └── theme-store.test.ts
├── store/
│   └── document.ts
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── prose.css
├── test/
│   └── setup.ts
├── main.tsx
└── App.tsx
```

---

## Task 1: Add Radix dependencies and theme foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/main.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/globals.css`
- Modify: `src/test/setup.ts`

**Step 1: Install Radix dependencies**

Run:

```bash
npm install @radix-ui/react-dropdown-menu @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-tooltip
```

Expected: npm adds the four Radix packages with no errors.

**Step 2: Create `src/styles/tokens.css`**

```css
:root {
  --surface-base: #f3f6f8;
  --surface-panel: rgba(255, 255, 255, 0.78);
  --surface-panel-strong: #ffffff;
  --surface-subtle: #e9eef2;
  --surface-editor: #fbfdff;
  --surface-preview: #ffffff;
  --text-primary: #18222b;
  --text-secondary: #5f6c78;
  --text-muted: #8693a0;
  --accent: #5b6478;
  --accent-strong: #455066;
  --success: #2fb36f;
  --ghost-border: rgba(69, 80, 102, 0.12);
  --shadow-ambient: 0 8px 32px rgba(42, 52, 57, 0.06);
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

.theme-dark {
  --surface-base: #10161d;
  --surface-panel: rgba(20, 28, 37, 0.82);
  --surface-panel-strong: #17202a;
  --surface-subtle: #1b2732;
  --surface-editor: #151e27;
  --surface-preview: #17212c;
  --text-primary: #eff4f8;
  --text-secondary: #bfccd8;
  --text-muted: #8795a3;
  --accent: #8f9bb5;
  --accent-strong: #a8b4cc;
  --success: #49c97f;
  --ghost-border: rgba(168, 180, 204, 0.16);
  --shadow-ambient: 0 12px 36px rgba(0, 0, 0, 0.28);
}
```

**Step 3: Create `src/styles/globals.css`**

```css
@import "./tokens.css";

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top, rgba(91, 100, 120, 0.08), transparent 28%),
    var(--surface-base);
  color: var(--text-primary);
  font-family: Inter, system-ui, sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

button,
input {
  font: inherit;
}
```

**Step 4: Update `src/main.tsx` to import global styles**

```tsx
import "./styles/globals.css";
```

Keep the existing app import and render logic.

**Step 5: Extend `src/test/setup.ts` for Radix-friendly tests**

```ts
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

**Step 6: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 7: Commit**

```bash
git add package.json package-lock.json src/main.tsx src/styles/tokens.css src/styles/globals.css src/test/setup.ts
git commit -m "chore(ui): add radix dependencies and design tokens"
```

---

## Task 2: Add feature-level theme state and document action helpers

**Files:**
- Create: `src/features/theme/theme-store.ts`
- Create: `src/features/theme/theme-store.test.ts`
- Create: `src/features/document/document-actions.ts`
- Create: `src/features/document/document-actions.test.ts`

**Step 1: Write the failing tests for `theme-store`**

Create `src/features/theme/theme-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./theme-store";

describe("theme-store", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
  });

  it("toggles between light and dark", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
```

**Step 2: Run the theme test to confirm failure**

```bash
npx vitest run src/features/theme/theme-store.test.ts
```

Expected: FAIL because `./theme-store` does not exist.

**Step 3: Implement `src/features/theme/theme-store.ts`**

```ts
import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set({ theme: get().theme === "light" ? "dark" : "light" }),
}));
```

**Step 4: Run the theme test to confirm pass**

```bash
npx vitest run src/features/theme/theme-store.test.ts
```

Expected: PASS.

**Step 5: Write the failing tests for document actions**

Create `src/features/document/document-actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getDisplayFileName, getWordCount } from "./document-actions";

describe("document-actions", () => {
  it("returns Untitled when no file path exists", () => {
    expect(getDisplayFileName(null)).toBe("Untitled");
  });

  it("returns the basename for windows paths", () => {
    expect(getDisplayFileName("C:\\\\notes\\\\draft.md")).toBe("draft.md");
  });

  it("counts words from markdown content", () => {
    expect(getWordCount("# Hello world from Markora")).toBe(4);
  });
});
```

**Step 6: Run the document actions test to confirm failure**

```bash
npx vitest run src/features/document/document-actions.test.ts
```

Expected: FAIL because `./document-actions` does not exist.

**Step 7: Implement `src/features/document/document-actions.ts`**

```ts
export function getDisplayFileName(filePath: string | null): string {
  if (!filePath) return "Untitled";
  return filePath.replace(/\\\\/g, "/").split("/").pop() ?? "Untitled";
}

export function getWordCount(content: string): number {
  const normalized = content.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}
```

**Step 8: Run both feature tests**

```bash
npx vitest run src/features/theme/theme-store.test.ts src/features/document/document-actions.test.ts
```

Expected: all tests PASS.

**Step 9: Commit**

```bash
git add src/features/theme src/features/document
git commit -m "feat(ui): add theme state and document helpers"
```

---

## Task 3: Refactor the current components into scalable `kebab-case` folders

**Files:**
- Create: `src/components/editor-page/editor-pane/editor-pane.tsx`
- Create: `src/components/editor-page/editor-pane/editor-pane.test.tsx`
- Create: `src/components/editor-page/editor-pane/editor-pane.css`
- Create: `src/components/editor-page/editor-pane/index.ts`
- Create: `src/components/editor-page/preview-pane/preview-pane.tsx`
- Create: `src/components/editor-page/preview-pane/preview-pane.test.tsx`
- Create: `src/components/editor-page/preview-pane/preview-pane.css`
- Create: `src/components/editor-page/preview-pane/index.ts`
- Create: `src/components/editor-page/workspace/workspace.tsx`
- Create: `src/components/editor-page/workspace/workspace.test.tsx`
- Create: `src/components/editor-page/workspace/workspace.css`
- Create: `src/components/editor-page/workspace/index.ts`
- Delete after migration: `src/components/Editor.tsx`
- Delete after migration: `src/components/Editor.test.tsx`
- Delete after migration: `src/components/Preview.tsx`
- Delete after migration: `src/components/Preview.test.tsx`
- Delete after migration: `src/components/SplitPane.tsx`
- Delete after migration: `src/components/SplitPane.test.tsx`

**Step 1: Copy the existing editor test into the new location and rename imports**

Create `src/components/editor-page/editor-pane/editor-pane.test.tsx` from the current editor smoke test, updating:

```ts
import { EditorPane } from "./editor-pane";
```

Expected behavior stays the same: it should render `.editor-pane`.

**Step 2: Run the editor-pane test to confirm failure**

```bash
npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx
```

Expected: FAIL because `./editor-pane` does not exist.

**Step 3: Implement `editor-pane.tsx` with the existing CodeMirror logic**

Use the current `Editor.tsx` logic, but:

- rename component to `EditorPane`
- rename CSS class from `editor-container` to `editor-pane`
- import `./editor-pane.css`

**Step 4: Add `editor-pane.css`**

```css
.editor-pane {
  height: 100%;
  padding: var(--space-4);
}

.editor-pane .editor-pane__surface {
  height: 100%;
  border-radius: var(--radius-lg);
  background: var(--surface-editor);
  box-shadow: var(--shadow-ambient);
  overflow: hidden;
}

.editor-pane .cm-editor {
  height: 100%;
  font-size: 16px;
  line-height: 1.7;
  background: transparent;
}
```

Wrap the mount node inside:

```tsx
<div className="editor-pane">
  <div ref={containerRef} className="editor-pane__surface" />
</div>
```

**Step 5: Run the editor-pane test to confirm pass**

```bash
npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx
```

**Step 6: Repeat the same migration pattern for `preview-pane`**

Port the existing preview test and implementation from `Preview.tsx`, using:

- component: `PreviewPane`
- root class: `.preview-pane`
- colocated CSS file

Run:

```bash
npx vitest run src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: PASS.

**Step 7: Repeat the same migration pattern for `workspace`**

Port the existing split-pane test and implementation from `SplitPane.tsx`, using:

- component: `Workspace`
- props: `editor`, `preview`
- classes: `.workspace`, `.workspace__left`, `.workspace__divider`, `.workspace__right`

Run:

```bash
npx vitest run src/components/editor-page/workspace/workspace.test.tsx
```

Expected: PASS.

**Step 8: Add barrel exports**

Create:

- `src/components/editor-page/editor-pane/index.ts`
- `src/components/editor-page/preview-pane/index.ts`
- `src/components/editor-page/workspace/index.ts`

Each file should export its component:

```ts
export { EditorPane } from "./editor-pane";
```

**Step 9: Remove the old flat component files**

Delete:

- `src/components/Editor.tsx`
- `src/components/Editor.test.tsx`
- `src/components/Preview.tsx`
- `src/components/Preview.test.tsx`
- `src/components/SplitPane.tsx`
- `src/components/SplitPane.test.tsx`

**Step 10: Run the current full test suite**

```bash
npx vitest run
```

Expected: PASS.

**Step 11: Commit**

```bash
git add src/components/editor-page src/components
git commit -m "refactor(ui): move editor page components into scalable folders"
```

---

## Task 4: Introduce shared Radix-based primitives

**Files:**
- Create: `src/components/shared/icon-button/icon-button.tsx`
- Create: `src/components/shared/icon-button/icon-button.test.tsx`
- Create: `src/components/shared/icon-button/icon-button.css`
- Create: `src/components/shared/icon-button/index.ts`
- Create: `src/components/shared/toolbar-group/toolbar-group.tsx`
- Create: `src/components/shared/toolbar-group/toolbar-group.test.tsx`
- Create: `src/components/shared/toolbar-group/toolbar-group.css`
- Create: `src/components/shared/toolbar-group/index.ts`
- Create: `src/components/shared/live-preview-indicator/live-preview-indicator.tsx`
- Create: `src/components/shared/live-preview-indicator/live-preview-indicator.test.tsx`
- Create: `src/components/shared/live-preview-indicator/live-preview-indicator.css`
- Create: `src/components/shared/live-preview-indicator/index.ts`
- Create: `src/components/shared/word-count/word-count.tsx`
- Create: `src/components/shared/word-count/word-count.test.tsx`
- Create: `src/components/shared/word-count/word-count.css`
- Create: `src/components/shared/word-count/index.ts`
- Create: `src/components/shared/theme-toggle/theme-toggle.tsx`
- Create: `src/components/shared/theme-toggle/theme-toggle.test.tsx`
- Create: `src/components/shared/theme-toggle/theme-toggle.css`
- Create: `src/components/shared/theme-toggle/index.ts`
- Create: `src/components/shared/file-menu/file-menu.tsx`
- Create: `src/components/shared/file-menu/file-menu.test.tsx`
- Create: `src/components/shared/file-menu/file-menu.css`
- Create: `src/components/shared/file-menu/index.ts`

**Step 1: Write the failing tests for `icon-button` and `toolbar-group`**

Minimal examples:

```tsx
render(<IconButton label="Save">Save</IconButton>);
expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
```

```tsx
render(<ToolbarGroup><button>One</button></ToolbarGroup>);
expect(container.querySelector(".toolbar-group")).toBeTruthy();
```

**Step 2: Run those tests to confirm failure**

```bash
npx vitest run src/components/shared/icon-button/icon-button.test.tsx src/components/shared/toolbar-group/toolbar-group.test.tsx
```

**Step 3: Implement `icon-button` and `toolbar-group`**

`icon-button.tsx`:

```tsx
import * as Tooltip from "@radix-ui/react-tooltip";
import "./icon-button.css";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, children, ...props }: IconButtonProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="icon-button" aria-label={label} {...props}>
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="icon-button__tooltip" sideOffset={8}>
            {label}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

`toolbar-group.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import "./toolbar-group.css";

export function ToolbarGroup({ children }: PropsWithChildren) {
  return <div className="toolbar-group">{children}</div>;
}
```

**Step 4: Add tests and implementation for `live-preview-indicator` and `word-count`**

Expected behaviors:

- preview indicator renders a green dot and “Live Preview”
- word count renders `0 words`, `1 word`, or `N words`

**Step 5: Add tests and implementation for `theme-toggle`**

Use Radix Switch. Test:

- renders a switch
- calls `onCheckedChange`

**Step 6: Add tests and implementation for `file-menu`**

Use Radix Dropdown Menu. Test:

- trigger button exists
- menu items for `Open`, `Save`, `Save As`, and `New` appear when clicked

**Step 7: Run all shared component tests**

```bash
npx vitest run src/components/shared
```

Expected: PASS.

**Step 8: Commit**

```bash
git add src/components/shared
git commit -m "feat(ui): add shared radix-based controls"
```

---

## Task 5: Build the premium top bar with page-specific components

**Files:**
- Create: `src/components/editor-page/document-status/document-status.tsx`
- Create: `src/components/editor-page/document-status/document-status.test.tsx`
- Create: `src/components/editor-page/document-status/document-status.css`
- Create: `src/components/editor-page/document-status/index.ts`
- Create: `src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx`
- Create: `src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx`
- Create: `src/components/editor-page/formatting-toolbar/formatting-toolbar.css`
- Create: `src/components/editor-page/formatting-toolbar/index.ts`
- Create: `src/components/editor-page/top-bar/top-bar.tsx`
- Create: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Create: `src/components/editor-page/top-bar/top-bar.css`
- Create: `src/components/editor-page/top-bar/index.ts`
- Delete after migration: `src/components/Toolbar.tsx`
- Delete after migration: `src/components/Toolbar.test.tsx`

**Step 1: Write the failing tests for `document-status`**

Test expectations:

- file name is displayed
- dirty state renders a subtle dot/chip

Example:

```tsx
render(<DocumentStatus fileName="notes.md" isDirty />);
expect(screen.getByText("notes.md")).toBeInTheDocument();
expect(screen.getByText("Unsaved")).toBeInTheDocument();
```

**Step 2: Run the test to confirm failure**

```bash
npx vitest run src/components/editor-page/document-status/document-status.test.tsx
```

**Step 3: Implement `document-status.tsx`**

Suggested API:

```tsx
interface DocumentStatusProps {
  fileName: string;
  isDirty: boolean;
}
```

Render:

- document label
- metadata text
- optional “Unsaved” status chip

**Step 4: Add the failing tests and implementation for `formatting-toolbar`**

This component is visual only in this pass.

Test expectations:

- renders formatting buttons like `Bold`, `Italic`, `List`
- uses `IconButton`

**Step 5: Add the failing tests for `top-bar`**

Test expectations:

- renders a left document-status area
- renders formatting toolbar
- renders word count
- renders live preview indicator
- renders theme toggle
- renders file menu trigger

**Step 6: Implement `top-bar.tsx`**

Suggested API:

```tsx
interface TopBarProps {
  fileName: string;
  isDirty: boolean;
  wordCount: number;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}
```

Use the shared components instead of raw buttons.

**Step 7: Add CSS for the premium top bar**

The CSS should:

- create grouped control surfaces
- avoid hard borders
- use tonal panels and subtle shadows
- keep the bar compact and structured

**Step 8: Delete old toolbar files**

Delete:

- `src/components/Toolbar.tsx`
- `src/components/Toolbar.test.tsx`

**Step 9: Run relevant tests**

```bash
npx vitest run src/components/editor-page/document-status src/components/editor-page/formatting-toolbar src/components/editor-page/top-bar
```

**Step 10: Commit**

```bash
git add src/components/editor-page src/components
git commit -m "feat(ui): add premium editor top bar"
```

---

## Task 6: Recompose the page around the new app shell

**Files:**
- Create: `src/app/app-shell/app-shell.tsx`
- Create: `src/app/app-shell/app-shell.test.tsx`
- Create: `src/app/app-shell/app-shell.css`
- Create: `src/app/app-shell/index.ts`
- Create: `src/app/index.ts`
- Modify: `src/App.tsx`
- Delete: `src/styles/app.css`

**Step 1: Write the failing test for `app-shell`**

Test expectations:

- renders top bar
- renders workspace

**Step 2: Run the test to confirm failure**

```bash
npx vitest run src/app/app-shell/app-shell.test.tsx
```

**Step 3: Implement `app-shell.tsx`**

Suggested props:

```tsx
interface AppShellProps {
  topBar: ReactNode;
  workspace: ReactNode;
  theme: "light" | "dark";
}
```

Render a theme class at the root:

```tsx
<div className={`app-shell theme-${theme}`}>...</div>
```

**Step 4: Move app-shell CSS out of the old global `app.css`**

Create `app-shell.css` to own:

- outer frame
- top spacing
- workspace spacing
- overall page max width and padding if used

**Step 5: Rewrite `src/App.tsx` to compose the new page**

Use:

- `TopBar`
- `Workspace`
- `EditorPane`
- `PreviewPane`
- `AppShell`
- `useThemeStore`
- `getDisplayFileName`
- `getWordCount`

Keep all existing document open/save/new/shortcut behavior, but:

- derive display metadata through helpers
- derive theme through `useThemeStore`

**Step 6: Delete the old global `src/styles/app.css`**

The old MVP monolith stylesheet should be removed after all references are gone.

**Step 7: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 8: Run full frontend tests**

```bash
npx vitest run
```

Expected: PASS.

**Step 9: Commit**

```bash
git add src/app src/App.tsx src/styles src/components
git commit -m "feat(ui): compose redesigned editor shell"
```

---

## Task 7: Upgrade preview prose styling and editor/page surfaces

**Files:**
- Create: `src/styles/prose.css`
- Modify: `src/components/editor-page/preview-pane/preview-pane.css`
- Modify: `src/components/editor-page/editor-pane/editor-pane.css`
- Modify: `src/components/editor-page/workspace/workspace.css`

**Step 1: Write a smoke test for preview prose classes if needed**

Add a CSS smoke test only if the repo already uses CSS assertions. Otherwise skip tests here and verify through existing preview rendering coverage plus type/test suite.

**Step 2: Create `src/styles/prose.css`**

Move and improve the markdown styling from the old `app.css`.

Include:

- larger title rhythm
- better reading width
- refined blockquotes
- better code blocks
- inline code treatment
- improved list spacing
- image rounding

Suggested root class:

```css
.prose {
  max-width: 720px;
  margin: 0 auto;
}
```

**Step 3: Update `preview-pane.tsx` to use the `prose` class**

Set:

```tsx
className="preview-pane prose"
```

or wrap inner HTML in a `.prose` child if preferred.

**Step 4: Refine `editor-pane.css`**

Add:

- calmer page padding
- improved monospace typography
- more page-like writing surface

**Step 5: Refine `workspace.css`**

Use:

- subtle tonal split
- quieter divider
- spacing-driven separation instead of obvious hard lines

**Step 6: Import `prose.css` from `src/main.tsx`**

```tsx
import "./styles/prose.css";
```

**Step 7: Run frontend tests and typecheck**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: both PASS.

**Step 8: Commit**

```bash
git add src/styles/prose.css src/components/editor-page
git commit -m "feat(ui): polish editor and preview surfaces"
```

---

## Task 8: Add final verification and documentation updates

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Step 1: Update `README.md`**

Add a short section describing:

- Radix Primitives in use
- component organization rules
- focused writing canvas design direction

**Step 2: Update `AGENTS.md`**

Add:

- `kebab-case` naming rule
- `components/shared` and `components/[page-name]/[component-name]` structure
- note that Radix is used for behavior, not styling identity

**Step 3: Run final verification**

```bash
npx vitest run
npx tsc --noEmit
cd src-tauri && cargo test
```

Expected:

- frontend tests PASS
- TypeScript PASS
- Rust tests PASS

**Step 4: Run the app**

```bash
cd ..
npm run tauri dev
```

Manual checklist:

- top bar uses the new premium structure
- editor still types normally
- preview still updates live
- file open/save/save as still work
- theme toggle works
- word count updates
- dirty state is visible
- workspace divider still drags
- overall layout feels calmer and more premium than MVP

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(ui): refresh markora with radix-based premium editor shell"
```

---

## Notes For The Implementer

- Do not introduce a left navigation rail in this phase.
- Do not turn the editor into a multi-page workspace shell.
- Do not let Radix styling leak into a generic component-library look.
- Keep components focused and colocated.
- Prefer TDD for logic-bearing components and helpers.
- For purely visual CSS polish, verify through existing test coverage plus manual runtime review.
