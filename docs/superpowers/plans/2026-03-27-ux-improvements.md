# Markora UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nine focused UX improvements that align Markora with its "Notepad for markdown" vision: sensible defaults, less chrome, cleaner layout, and quality-of-life features.

**Architecture:** Each task is isolated to one or two files. Toolbar and focus mode introduce two new Zustand stores co-located with the existing workspace stores. Scroll sync uses React `forwardRef` + `useImperativeHandle` to expose CodeMirror's `scrollDOM` without prop drilling. Session restore uses `localStorage`. Drag-and-drop uses the Tauri v2 `onDragDropEvent` API. No new npm dependencies are required.

**Tech Stack:** React 18, Zustand 5, CodeMirror 6, Tauri v2 (`@tauri-apps/api/window`), Vitest, @testing-library/react

---

## File Map

**Created:**
- `src/features/workspace/toolbar-state.ts`
- `src/features/workspace/toolbar-state.test.ts`
- `src/features/workspace/focus-mode-state.ts`
- `src/features/workspace/focus-mode-state.test.ts`

**Modified:**
- `src/features/workspace/workspace-state.ts` — default `"edit"` → `"split"`
- `src/features/workspace/workspace-state.test.ts` — update default assertion
- `src/components/editor-page/tab-strip/tab-strip.tsx` — `Untitled N` numbering
- `src/components/editor-page/tab-strip/tab-strip.test.tsx` — update untitled assertion
- `src/components/editor-page/top-bar/top-bar.tsx` — remove view switcher; toolbar hidden by default; View menu adds Toolbar toggle
- `src/components/editor-page/top-bar/top-bar.test.tsx` — remove viewMode props; add toolbar hidden test
- `src/components/editor-page/footer-status-bar/footer-status-bar.tsx` — add ViewModeSwitcher; reads workspace state internally; remove `viewMode` prop
- `src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx` — set store state; update assertions
- `src/components/editor-page/editor-pane/editor-pane.tsx` — `forwardRef` exposing `scrollEl`
- `src/components/editor-page/editor-pane/index.ts` — re-export `EditorPaneHandle`
- `src/components/editor-page/preview-pane/preview-pane.tsx` — `forwardRef` exposing scroll container
- `src/app/app-shell/app-shell.tsx` — hide chrome when focused
- `src/app/app-shell/app-shell.test.tsx` — add focus mode test
- `src/App.tsx` — window title; drag-drop; scroll sync refs; session restore; Ctrl+Shift+T; F11; extract `handleOpenPath`

---

## Task 1: Default to Split View

**Files:**
- Modify: `src/features/workspace/workspace-state.ts:11`
- Test: `src/features/workspace/workspace-state.test.ts`

- [ ] **Step 1: Update the test to expect "split" as the default**

Replace `src/features/workspace/workspace-state.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceState } from "./workspace-state";

describe("workspace-state", () => {
  beforeEach(() => {
    useWorkspaceState.setState({ viewMode: "edit" });
  });

  it("defaults to split mode", () => {
    useWorkspaceState.setState(useWorkspaceState.getInitialState());
    expect(useWorkspaceState.getState().viewMode).toBe("split");
  });

  it("switches the active view mode", () => {
    useWorkspaceState.getState().setViewMode("preview");
    expect(useWorkspaceState.getState().viewMode).toBe("preview");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/features/workspace/workspace-state.test.ts
```

Expected: FAIL — `"edit"` is not `"split"`

- [ ] **Step 3: Change the default in workspace-state.ts**

In `src/features/workspace/workspace-state.ts`, line 11, change `"edit"` to `"split"`:

```ts
export const useWorkspaceState = create<WorkspaceState>((set) => ({
  viewMode: "split",
  setViewMode: (viewMode) => set({ viewMode }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/features/workspace/workspace-state.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/workspace/workspace-state.ts src/features/workspace/workspace-state.test.ts
git commit -m "feat: default to split view mode"
```

---

## Task 2: Window Title Syncs to Active Document

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the getCurrentWindow import**

At the top of `src/App.tsx`, alongside the existing tauri imports, add:

```ts
import { getCurrentWindow } from "@tauri-apps/api/window";
```

- [ ] **Step 2: Add filePath and isDirty selectors in the App component body**

After the existing `useWorkspaceState` selectors, add:

```ts
const filePath = useDocumentStore((state) => state.filePath);
const isDirty = useDocumentStore((state) => state.isDirty);
```

- [ ] **Step 3: Add the window title effect**

After the keyboard shortcut `useEffect`, add:

```ts
useEffect(() => {
  const fileName = filePath ? getDisplayFileName(filePath) : "Untitled";
  const prefix = isDirty ? "● " : "";
  void getCurrentWindow().setTitle(`${prefix}${fileName} — Markora`);
}, [filePath, isDirty]);
```

- [ ] **Step 4: Verify manually**

Run `npm run tauri dev`. Open a file — the title bar should show `filename.md — Markora`. Edit — `● filename.md — Markora`. Save — dot disappears.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: sync window title to active document name and dirty state"
```

---

## Task 3: Untitled Tab Numbering

**Files:**
- Modify: `src/components/editor-page/tab-strip/tab-strip.tsx`
- Test: `src/components/editor-page/tab-strip/tab-strip.test.tsx`

- [ ] **Step 1: Update the tests to use realistic document IDs and expect "Untitled N"**

Replace `src/components/editor-page/tab-strip/tab-strip.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabStrip } from "./tab-strip";

describe("TabStrip", () => {
  it("renders tabs with an active document and a new-tab action", () => {
    const { container } = render(
      <TabStrip
        tabs={[
          { id: "document-1", content: "", filePath: "D:\\notes\\one.md", isDirty: false },
          { id: "document-2", content: "", filePath: null, isDirty: true },
        ]}
        activeTabId="document-1"
        onSelectTab={vi.fn()}
        onCloseTab={vi.fn()}
        onNewTab={vi.fn()}
      />,
    );

    expect(container.firstChild).toHaveClass("border-b", "bg-app-panel/96");
    expect(screen.getByRole("tab", { name: "one.md" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Untitled 2 *" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New tab" })).toBeInTheDocument();
  });

  it("invokes tab actions", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const onNewTab = vi.fn();

    render(
      <TabStrip
        tabs={[{ id: "document-1", content: "", filePath: "D:\\notes\\one.md", isDirty: false }]}
        activeTabId="document-1"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "one.md" }));
    await user.click(screen.getByRole("button", { name: "Close one.md" }));
    await user.click(screen.getByRole("button", { name: "New tab" }));

    expect(onSelectTab).toHaveBeenCalledWith("document-1");
    expect(onCloseTab).toHaveBeenCalledWith("document-1");
    expect(onNewTab).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx
```

Expected: FAIL — `"Untitled *"` is not `"Untitled 2 *"`

- [ ] **Step 3: Add the getTabTitle helper and update the render in tab-strip.tsx**

In `src/components/editor-page/tab-strip/tab-strip.tsx`, add this function before the `TabStrip` component (after the imports):

```ts
function getTabTitle(tab: DocumentTab): string {
  if (tab.filePath) return getDisplayFileName(tab.filePath);
  const match = /^document-(\d+)$/.exec(tab.id);
  return match ? `Untitled ${match[1]}` : "Untitled";
}
```

Then replace the title line inside the `.map()`:

```ts
const title = getTabTitle(tab);
```

(Previously: `const title = getDisplayFileName(tab.filePath);`)

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/editor-page/tab-strip/tab-strip.tsx src/components/editor-page/tab-strip/tab-strip.test.tsx
git commit -m "feat: show Untitled N numbering for unsaved tabs"
```

---

## Task 4: Move View Mode Switcher to Footer

**Files:**
- Modify: `src/components/editor-page/footer-status-bar/footer-status-bar.tsx`
- Modify: `src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update footer tests to set store state instead of passing a prop**

Replace `src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterStatusBar } from "./footer-status-bar";
import { useWorkspaceState } from "../../../features/workspace/workspace-state";

describe("FooterStatusBar", () => {
  beforeEach(() => {
    useWorkspaceState.setState({ viewMode: "split" });
  });

  it("renders status info, view mode switcher, and word count", () => {
    render(<FooterStatusBar wordCount={12} line={8} column={14} />);

    expect(screen.getByRole("contentinfo", { name: "Footer status bar" })).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Markdown")).toBeInTheDocument();
    expect(screen.getByText("Ln 8, Col 14")).toBeInTheDocument();
    expect(screen.getByText("12 words")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Split" })).toHaveAttribute("aria-selected", "true");
  });
});
```

- [ ] **Step 2: Run footer tests to verify they fail**

```
npx vitest run src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx
```

Expected: FAIL

- [ ] **Step 3: Rewrite footer-status-bar.tsx to read state internally and render ViewModeSwitcher**

Replace `src/components/editor-page/footer-status-bar/footer-status-bar.tsx`:

```tsx
import { WordCount } from "../../shared/word-count";
import { ViewModeSwitcher } from "../view-mode-switcher";
import { useWorkspaceState } from "../../../features/workspace/workspace-state";

interface FooterStatusBarProps {
  wordCount: number;
  line: number;
  column: number;
}

export function FooterStatusBar({ wordCount, line, column }: FooterStatusBarProps) {
  const viewMode = useWorkspaceState((state) => state.viewMode);
  const setViewMode = useWorkspaceState((state) => state.setViewMode);

  return (
    <footer
      className="flex items-center justify-between border-t border-[color:var(--ghost-border)] bg-app-panel/88 px-3 py-1.5 text-app-text-secondary backdrop-blur-md"
      aria-label="Footer status bar"
    >
      <div className="flex items-center gap-3">
        <span className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-app-text-muted">
          Status
        </span>
        <span className="text-sm text-app-text-muted">Markdown</span>
        <span className="text-sm text-app-text-muted">{`Ln ${line}, Col ${column}`}</span>
      </div>
      <div className="flex items-center gap-3">
        <ViewModeSwitcher value={viewMode} onValueChange={setViewMode} />
        <WordCount value={wordCount} />
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run footer tests to verify they pass**

```
npx vitest run src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx
```

Expected: PASS

- [ ] **Step 5: Update top-bar.test.tsx to remove viewMode/onViewModeChange props**

Replace `src/components/editor-page/top-bar/top-bar.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopBar } from "./top-bar";

const defaultProps = {
  onThemeToggle: vi.fn(),
  onNew: vi.fn(),
  onOpen: vi.fn(),
  onSave: vi.fn(),
  onSaveAs: vi.fn(),
};

describe("TopBar", () => {
  it("renders menu, toolbar, and settings zones", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByTestId("top-bar-menu")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("renders a settings icon button in the utilities zone", () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("uses a compact command bar layout", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByRole("banner")).toHaveClass("px-3", "py-2");
    expect(screen.getByRole("banner")).toHaveClass("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(screen.getByTestId("top-bar-toolbar")).toHaveClass("justify-center");
    expect(screen.getByTestId("top-bar-utilities")).toHaveClass("gap-2", "rounded-full", "p-0");
  });

  it("does not render the view mode switcher (it lives in the footer)", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.queryByRole("tab", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Split" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Preview" })).not.toBeInTheDocument();
  });

  it("invokes file actions from the File menu", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(<TopBar {...defaultProps} onOpen={onOpen} />);

    await user.click(screen.getByRole("button", { name: "File" }));
    await user.click(screen.getByRole("menuitem", { name: "Open" }));

    expect(onOpen).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Update top-bar.tsx to remove ViewModeSwitcher**

Replace `src/components/editor-page/top-bar/top-bar.tsx`:

```tsx
import { MenuBar } from "../../shared/menu-bar";
import { IconButton } from "../../shared/icon-button";
import { FormattingToolbar } from "../formatting-toolbar";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";

interface TopBarProps {
  onThemeToggle: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export function TopBar({ onThemeToggle, onNew, onOpen, onSave, onSaveAs }: TopBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);

  const menuGroups = [
    {
      label: "File",
      items: [
        { label: "New", onSelect: onNew },
        { label: "Open", onSelect: onOpen },
        { label: "Save", onSelect: onSave },
        { label: "Save As", onSelect: onSaveAs },
      ],
    },
    {
      label: "Edit",
      items: [{ label: "Undo", disabled: true }, { label: "Redo", disabled: true }],
    },
    {
      label: "View",
      items: [{ label: "Theme", onSelect: onThemeToggle }, { label: "Live Preview", disabled: true }],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard Shortcuts", disabled: true },
        { label: "About Markora", disabled: true },
      ],
    },
  ];

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--ghost-border)] bg-app-panel/90 px-3 py-2 backdrop-blur-md">
      <div className="flex min-w-0 items-center justify-start gap-2" data-testid="top-bar-menu">
        <MenuBar groups={menuGroups} />
      </div>
      <div className="flex min-w-0 items-center justify-center" data-testid="top-bar-toolbar">
        <FormattingToolbar
          onHeading={() => runToolbarAction("heading")}
          onBold={() => runToolbarAction("bold")}
          onItalic={() => runToolbarAction("italic")}
          onStrike={() => runToolbarAction("strike")}
          onBulletList={() => runToolbarAction("bulletList")}
          onOrderedList={() => runToolbarAction("orderedList")}
          onTaskList={() => runToolbarAction("taskList")}
          onQuote={() => runToolbarAction("quote")}
          onCodeBlock={() => runToolbarAction("codeBlock")}
          onLink={() => runToolbarAction("link")}
          onTable={() => runToolbarAction("table")}
          onImage={() => runToolbarAction("image")}
        />
      </div>
      <div
        className="flex items-center justify-end gap-2 rounded-full p-0"
        data-testid="top-bar-utilities"
      >
        <IconButton label="Settings" type="button">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.25" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.7Z" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Update App.tsx to remove viewMode/onViewModeChange from TopBar and viewMode from FooterStatusBar**

In `src/App.tsx`:

Change the `commandBar` constant:
```tsx
const commandBar = (
  <TopBar
    onThemeToggle={toggleTheme}
    onNew={handleNew}
    onOpen={handleOpen}
    onSave={handleSave}
    onSaveAs={handleSaveAs}
  />
);
```

Change the `statusBar` constant:
```tsx
const statusBar = (
  <FooterStatusBar wordCount={wordCount} line={line} column={column} />
);
```

Remove `setViewMode` from the `useWorkspaceState` destructure (keep `viewMode` — Workspace still needs it):
```ts
const viewMode = useWorkspaceState((state) => state.viewMode);
```

- [ ] **Step 8: Run all affected tests**

```
npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx
```

Expected: all PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/footer-status-bar/footer-status-bar.tsx src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx src/App.tsx
git commit -m "feat: move view mode switcher from top bar to footer status bar"
```

---

## Task 5: Toolbar Hidden by Default + Ctrl+Shift+T Toggle

**Files:**
- Create: `src/features/workspace/toolbar-state.ts`
- Create: `src/features/workspace/toolbar-state.test.ts`
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for the toolbar store**

Create `src/features/workspace/toolbar-state.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useToolbarStore } from "./toolbar-state";

describe("toolbar-state", () => {
  beforeEach(() => {
    useToolbarStore.setState({ isVisible: false });
  });

  it("is hidden by default", () => {
    useToolbarStore.setState(useToolbarStore.getInitialState());
    expect(useToolbarStore.getState().isVisible).toBe(false);
  });

  it("toggles visibility", () => {
    useToolbarStore.getState().toggleToolbar();
    expect(useToolbarStore.getState().isVisible).toBe(true);

    useToolbarStore.getState().toggleToolbar();
    expect(useToolbarStore.getState().isVisible).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/workspace/toolbar-state.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create toolbar-state.ts**

Create `src/features/workspace/toolbar-state.ts`:

```ts
import { create } from "zustand";

interface ToolbarState {
  isVisible: boolean;
  toggleToolbar: () => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
  isVisible: false,
  toggleToolbar: () => set((state) => ({ isVisible: !state.isVisible })),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/features/workspace/toolbar-state.test.ts
```

Expected: PASS

- [ ] **Step 5: Update top-bar.tsx to conditionally render the toolbar and add Toolbar to the View menu**

Replace `src/components/editor-page/top-bar/top-bar.tsx`:

```tsx
import { MenuBar } from "../../shared/menu-bar";
import { IconButton } from "../../shared/icon-button";
import { FormattingToolbar } from "../formatting-toolbar";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { useToolbarStore } from "../../../features/workspace/toolbar-state";

interface TopBarProps {
  onThemeToggle: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export function TopBar({ onThemeToggle, onNew, onOpen, onSave, onSaveAs }: TopBarProps) {
  const runToolbarAction = useEditorCommandState((state) => state.runToolbarAction);
  const { isVisible: isToolbarVisible, toggleToolbar } = useToolbarStore();

  const menuGroups = [
    {
      label: "File",
      items: [
        { label: "New", onSelect: onNew },
        { label: "Open", onSelect: onOpen },
        { label: "Save", onSelect: onSave },
        { label: "Save As", onSelect: onSaveAs },
      ],
    },
    {
      label: "Edit",
      items: [{ label: "Undo", disabled: true }, { label: "Redo", disabled: true }],
    },
    {
      label: "View",
      items: [
        { label: "Theme", onSelect: onThemeToggle },
        { label: "Toolbar", onSelect: toggleToolbar },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Keyboard Shortcuts", disabled: true },
        { label: "About Markora", disabled: true },
      ],
    },
  ];

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--ghost-border)] bg-app-panel/90 px-3 py-2 backdrop-blur-md">
      <div className="flex min-w-0 items-center justify-start gap-2" data-testid="top-bar-menu">
        <MenuBar groups={menuGroups} />
      </div>
      <div className="flex min-w-0 items-center justify-center" data-testid="top-bar-toolbar">
        {isToolbarVisible && (
          <FormattingToolbar
            onHeading={() => runToolbarAction("heading")}
            onBold={() => runToolbarAction("bold")}
            onItalic={() => runToolbarAction("italic")}
            onStrike={() => runToolbarAction("strike")}
            onBulletList={() => runToolbarAction("bulletList")}
            onOrderedList={() => runToolbarAction("orderedList")}
            onTaskList={() => runToolbarAction("taskList")}
            onQuote={() => runToolbarAction("quote")}
            onCodeBlock={() => runToolbarAction("codeBlock")}
            onLink={() => runToolbarAction("link")}
            onTable={() => runToolbarAction("table")}
            onImage={() => runToolbarAction("image")}
          />
        )}
      </div>
      <div
        className="flex items-center justify-end gap-2 rounded-full p-0"
        data-testid="top-bar-utilities"
      >
        <IconButton label="Settings" type="button">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3.25" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.7Z" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Add toolbar hidden/visible tests to top-bar.test.tsx**

In `src/components/editor-page/top-bar/top-bar.test.tsx`, add at the top of the file:

```ts
import { beforeEach } from "vitest";
import { useToolbarStore } from "../../../features/workspace/toolbar-state";
```

Add inside the `describe("TopBar", ...)` block, before the existing tests:

```ts
beforeEach(() => {
  useToolbarStore.setState({ isVisible: false });
});
```

Add these two new tests at the end of the describe block:

```ts
it("hides the formatting toolbar by default", () => {
  render(<TopBar {...defaultProps} />);
  expect(screen.queryByLabelText("Formatting")).not.toBeInTheDocument();
});

it("shows the formatting toolbar when the store is visible", () => {
  useToolbarStore.setState({ isVisible: true });
  render(<TopBar {...defaultProps} />);
  expect(screen.getByLabelText("Formatting")).toBeInTheDocument();
});
```

- [ ] **Step 7: Add Ctrl+Shift+T shortcut in App.tsx**

In `src/App.tsx`, add the import:

```ts
import { useToolbarStore } from "./features/workspace/toolbar-state";
```

Inside the `onKeyDown` handler in the keyboard shortcuts `useEffect`, add after the existing `mod` shortcuts:

```ts
if (mod && event.shiftKey && event.key === "T") {
  event.preventDefault();
  useToolbarStore.getState().toggleToolbar();
}
```

- [ ] **Step 8: Run all affected tests**

```
npx vitest run src/features/workspace/toolbar-state.test.ts src/components/editor-page/top-bar/top-bar.test.tsx
```

Expected: all PASS

- [ ] **Step 9: Commit**

```bash
git add src/features/workspace/toolbar-state.ts src/features/workspace/toolbar-state.test.ts src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/App.tsx
git commit -m "feat: hide toolbar by default, toggle with Ctrl+Shift+T or View > Toolbar"
```

---

## Task 6: Focus Mode (F11)

**Files:**
- Create: `src/features/workspace/focus-mode-state.ts`
- Create: `src/features/workspace/focus-mode-state.test.ts`
- Modify: `src/app/app-shell/app-shell.tsx`
- Modify: `src/app/app-shell/app-shell.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for the focus mode store**

Create `src/features/workspace/focus-mode-state.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useFocusModeStore } from "./focus-mode-state";

describe("focus-mode-state", () => {
  beforeEach(() => {
    useFocusModeStore.setState({ isFocused: false });
  });

  it("is not focused by default", () => {
    useFocusModeStore.setState(useFocusModeStore.getInitialState());
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });

  it("toggles focus mode", () => {
    useFocusModeStore.getState().toggleFocusMode();
    expect(useFocusModeStore.getState().isFocused).toBe(true);

    useFocusModeStore.getState().toggleFocusMode();
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/features/workspace/focus-mode-state.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Create focus-mode-state.ts**

Create `src/features/workspace/focus-mode-state.ts`:

```ts
import { create } from "zustand";

interface FocusModeState {
  isFocused: boolean;
  toggleFocusMode: () => void;
}

export const useFocusModeStore = create<FocusModeState>((set) => ({
  isFocused: false,
  toggleFocusMode: () => set((state) => ({ isFocused: !state.isFocused })),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/features/workspace/focus-mode-state.test.ts
```

Expected: PASS

- [ ] **Step 5: Update app-shell.tsx to hide chrome in focus mode**

Replace `src/app/app-shell/app-shell.tsx`:

```tsx
import { useEffect, type ReactNode } from "react";
import { useFocusModeStore } from "../../features/workspace/focus-mode-state";

interface AppShellProps {
  theme: "light" | "dark";
  tabStrip: ReactNode;
  commandBar: ReactNode;
  workspace: ReactNode;
  statusBar: ReactNode;
}

export function AppShell({ theme, tabStrip, commandBar, workspace, statusBar }: AppShellProps) {
  const isFocused = useFocusModeStore((state) => state.isFocused);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("theme-dark", theme === "dark");

    return () => {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("theme-dark");
    };
  }, [theme]);

  return (
    <div
      data-testid="app-shell"
      className={`flex h-screen h-dvh w-full flex-col overflow-hidden bg-app-bg text-app-text antialiased ${theme === "dark" ? "theme-dark" : ""}`}
    >
      {!isFocused && <div className="shrink-0">{tabStrip}</div>}
      {!isFocused && <div className="shrink-0">{commandBar}</div>}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{workspace}</div>
      {!isFocused && <div className="shrink-0">{statusBar}</div>}
    </div>
  );
}
```

- [ ] **Step 6: Add focus mode tests to app-shell.test.tsx**

In `src/app/app-shell/app-shell.test.tsx`, add at the top:

```ts
import { beforeEach } from "vitest";
import { useFocusModeStore } from "../../features/workspace/focus-mode-state";
```

Add inside the `describe("AppShell", ...)` block, before the existing tests:

```ts
beforeEach(() => {
  useFocusModeStore.setState({ isFocused: false });
});
```

Add this new test at the end of the describe block:

```ts
it("hides tab strip, command bar, and status bar in focus mode", () => {
  useFocusModeStore.setState({ isFocused: true });

  render(
    <AppShell
      theme="light"
      tabStrip={<div>Tab Strip</div>}
      commandBar={<div>Command Bar</div>}
      workspace={<div>Workspace</div>}
      statusBar={<div>Status Bar</div>}
    />,
  );

  expect(screen.queryByText("Tab Strip")).not.toBeInTheDocument();
  expect(screen.queryByText("Command Bar")).not.toBeInTheDocument();
  expect(screen.queryByText("Status Bar")).not.toBeInTheDocument();
  expect(screen.getByText("Workspace")).toBeInTheDocument();
});
```

- [ ] **Step 7: Add F11 shortcut in App.tsx**

Add the import at the top of `src/App.tsx`:

```ts
import { useFocusModeStore } from "./features/workspace/focus-mode-state";
```

In the `onKeyDown` handler, add after the `if (!mod) return` block (so F11 works without a modifier key):

```ts
if (event.key === "F11") {
  event.preventDefault();
  useFocusModeStore.getState().toggleFocusMode();
}
```

- [ ] **Step 8: Run all affected tests**

```
npx vitest run src/features/workspace/focus-mode-state.test.ts src/app/app-shell/app-shell.test.tsx
```

Expected: all PASS

- [ ] **Step 9: Commit**

```bash
git add src/features/workspace/focus-mode-state.ts src/features/workspace/focus-mode-state.test.ts src/app/app-shell/app-shell.tsx src/app/app-shell/app-shell.test.tsx src/App.tsx
git commit -m "feat: focus mode with F11 hides chrome for distraction-free writing"
```

---

## Task 7: Scroll Sync in Split View

**Files:**
- Modify: `src/components/editor-page/editor-pane/editor-pane.tsx`
- Modify: `src/components/editor-page/editor-pane/index.ts`
- Modify: `src/components/editor-page/preview-pane/preview-pane.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add forwardRef + EditorPaneHandle to editor-pane.tsx**

Replace `src/components/editor-page/editor-pane/editor-pane.tsx` with the full file below. The only changes are: `forwardRef` wrapping, the `EditorPaneHandle` export, `useImperativeHandle`, and adding `forwardRef` + `useImperativeHandle` to the React import. All existing logic is unchanged.

```tsx
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useDocumentStore } from "../../../store/document";
import { useEditorCommandState } from "../../../features/editor/editor-command-state";
import { applyMarkdownToolbarAction, type MarkdownToolbarAction } from "../../../features/editor/markdown-toolbar-actions";
import {
  applySlashCommand,
  getSlashCommandContext,
  matchSlashCommands,
  type SlashCommandDefinition,
} from "../../../features/editor/slash-commands";
import { useEditorStatusState } from "../../../features/workspace/editor-status-state";
import { SlashCommandMenu } from "../slash-command-menu/slash-command-menu";

export interface EditorPaneHandle {
  readonly scrollEl: HTMLElement | null;
}

interface EditorPaneProps {
  theme: "light" | "dark";
}

interface SlashMenuState {
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  from: number;
  to: number;
  position: {
    top: number;
    left: number;
  };
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(function EditorPane(
  { theme },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { content, setContent } = useDocumentStore();
  const setCursorPosition = useEditorStatusState((state) => state.setCursorPosition);
  const setRunToolbarAction = useEditorCommandState((state) => state.setRunToolbarAction);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      get scrollEl() {
        return viewRef.current?.scrollDOM ?? null;
      },
    }),
    [],
  );

  const applyEditResult = (text: string, selectionStart: number, selectionEnd: number) => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text },
      selection: { anchor: selectionStart, head: selectionEnd },
    });
    view.focus();
  };

  const applySelectedSlashCommand = (commandId: SlashCommandDefinition["id"]) => {
    const view = viewRef.current;
    if (!view || !slashMenu) return;

    const result = applySlashCommand(
      view.state.doc.toString(),
      slashMenu.from,
      slashMenu.to,
      commandId,
    );

    applyEditResult(result.text, result.selectionStart, result.selectionEnd);
    setSlashMenu(null);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = CMView.updateListener.of((update) => {
      if (update.docChanged) {
        setContent(update.state.doc.toString());
      }

      if (update.docChanged || update.selectionSet || update.focusChanged) {
        const cursor = update.state.selection.main.head;
        const line = update.state.doc.lineAt(cursor);
        setCursorPosition(line.number, cursor - line.from + 1);

        const context = getSlashCommandContext(update.state.doc.toString(), cursor);
        if (!context) {
          setSlashMenu(null);
          return;
        }

        const commands = matchSlashCommands(context.query);
        if (commands.length === 0) {
          setSlashMenu(null);
          return;
        }

        const coords = viewRef.current?.coordsAtPos(cursor);
        const containerBounds = containerRef.current?.getBoundingClientRect();
        setSlashMenu({
          commands,
          selectedIndex: 0,
          from: context.from,
          to: context.to,
          position: {
            top: (coords?.bottom ?? 0) - (containerBounds?.top ?? 0) + 10,
            left: (coords?.left ?? 0) - (containerBounds?.left ?? 0),
          },
        });
      }
    });

    const state = EditorState.create({
      doc: useDocumentStore.getState().content,
      extensions: [
        basicSetup,
        markdown(),
        updateListener,
        CMView.lineWrapping,
        ...(theme === "dark" ? [oneDark] : []),
      ],
    });

    viewRef.current?.destroy();
    viewRef.current = new EditorView({ state, parent: containerRef.current });

    return () => {
      viewRef.current?.destroy();
    };
  }, [setContent, setCursorPosition, theme]);

  useEffect(() => {
    const runAction = (action: MarkdownToolbarAction) => {
      const view = viewRef.current;
      if (!view) return;

      const selection = view.state.selection.main;
      const result = applyMarkdownToolbarAction(
        view.state.doc.toString(),
        selection.from,
        selection.to,
        action,
      );

      applyEditResult(result.text, result.selectionStart, result.selectionEnd);
    };

    setRunToolbarAction(() => runAction);
    return () => setRunToolbarAction(() => {});
  }, [setRunToolbarAction]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  return (
    <section
      className="editor-pane h-full min-h-0 pb-0 pr-0"
      aria-label="Editor"
      onKeyDownCapture={(event) => {
        if (!slashMenu) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? { ...current, selectedIndex: (current.selectedIndex + 1) % current.commands.length }
              : current,
          );
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashMenu((current) =>
            current
              ? {
                  ...current,
                  selectedIndex:
                    (current.selectedIndex - 1 + current.commands.length) % current.commands.length,
                }
              : current,
          );
        }

        if (event.key === "Enter") {
          event.preventDefault();
          const selectedCommand = slashMenu.commands[slashMenu.selectedIndex];
          if (selectedCommand) {
            applySelectedSlashCommand(selectedCommand.id);
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setSlashMenu(null);
        }
      }}
    >
      <div className="editor-pane__panel flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--ghost-border)] bg-app-editor shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
        <div className="relative min-h-0 flex-1">
          <div
            ref={containerRef}
            className="editor-pane__surface min-h-0 h-full flex-1 overflow-hidden bg-app-editor"
            data-testid="editor-surface"
          />
          {slashMenu ? (
            <SlashCommandMenu
              commands={slashMenu.commands}
              selectedIndex={slashMenu.selectedIndex}
              position={slashMenu.position}
              onSelect={applySelectedSlashCommand}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
});
```

- [ ] **Step 2: Re-export EditorPaneHandle from the index**

Replace `src/components/editor-page/editor-pane/index.ts`:

```ts
export { EditorPane, type EditorPaneHandle } from "./editor-pane";
```

- [ ] **Step 3: Add forwardRef to preview-pane.tsx**

Replace `src/components/editor-page/preview-pane/preview-pane.tsx`:

{% raw %}
```tsx
import { forwardRef, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDocumentStore } from "../../../store/document";

export const PreviewPane = forwardRef<HTMLDivElement, object>(function PreviewPane(_, ref) {
  const content = useDocumentStore((state) => state.content);
  const [html, setHtml] = useState("");

  useEffect(() => {
    invoke<string>("parse_markdown", { markdown: content })
      .then(setHtml)
      .catch((error) => console.error("parse_markdown failed:", error));
  }, [content]);

  return (
    <section className="preview-pane h-full min-h-0 pl-0 pr-0" aria-label="Preview">
      <div
        ref={ref}
        className="preview-pane__surface h-full overflow-auto rounded-[var(--radius-lg)] border border-[var(--ghost-border)] bg-app-preview shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]"
      >
        <div
          className="preview-pane__content prose mx-auto max-w-[44rem] p-[calc(var(--space-6)-0.1rem)]"
          data-testid="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
});
```
{% endraw %}

- [ ] **Step 4: Add refs and scroll sync effect in App.tsx**

Add to the React import at the top of `src/App.tsx`:

```ts
import { useCallback, useEffect, useRef } from "react";
```

Add the type import alongside the EditorPane import:

```ts
import { EditorPane, type EditorPaneHandle } from "./components/editor-page/editor-pane";
```

Add refs in the App component body (before the `handleOpen` callback):

```ts
const editorRef = useRef<EditorPaneHandle>(null);
const previewScrollRef = useRef<HTMLDivElement>(null);
```

Add the scroll sync effect (after the window title effect):

```ts
useEffect(() => {
  if (viewMode === "edit") return;

  const editorEl = editorRef.current?.scrollEl;
  const previewEl = previewScrollRef.current;
  if (!editorEl || !previewEl) return;

  let editorScrolling = false;
  let previewScrolling = false;

  const syncFromEditor = () => {
    if (previewScrolling) return;
    editorScrolling = true;
    const maxScroll = editorEl.scrollHeight - editorEl.clientHeight;
    if (maxScroll > 0) {
      const pct = editorEl.scrollTop / maxScroll;
      previewEl.scrollTop = pct * (previewEl.scrollHeight - previewEl.clientHeight);
    }
    requestAnimationFrame(() => {
      editorScrolling = false;
    });
  };

  const syncFromPreview = () => {
    if (editorScrolling) return;
    previewScrolling = true;
    const maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
    if (maxScroll > 0) {
      const pct = previewEl.scrollTop / maxScroll;
      editorEl.scrollTop = pct * (editorEl.scrollHeight - editorEl.clientHeight);
    }
    requestAnimationFrame(() => {
      previewScrolling = false;
    });
  };

  editorEl.addEventListener("scroll", syncFromEditor, { passive: true });
  previewEl.addEventListener("scroll", syncFromPreview, { passive: true });

  return () => {
    editorEl.removeEventListener("scroll", syncFromEditor);
    previewEl.removeEventListener("scroll", syncFromPreview);
  };
}, [viewMode]);
```

Update the `workspace` constant to pass refs:

```tsx
const workspace = (
  <Workspace
    left={<EditorPane ref={editorRef} theme={theme} />}
    right={<PreviewPane ref={previewScrollRef} />}
    viewMode={viewMode}
  />
);
```

- [ ] **Step 5: Run existing pane tests to verify no regressions**

```
npx vitest run src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx
```

Expected: all PASS

- [ ] **Step 6: Verify manually**

Run `npm run tauri dev`. In split view, open a long markdown file. Scroll the editor — the preview scrolls to the same relative position. Scroll the preview — the editor follows.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/editor-pane/index.ts src/components/editor-page/preview-pane/preview-pane.tsx src/App.tsx
git commit -m "feat: sync editor and preview scroll position in split and preview modes"
```

---

## Task 8: Drag and Drop to Open Files

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Extract handleOpenPath and update handleOpen to reuse it**

In `src/App.tsx`, add `handleOpenPath` before `handleOpen`:

```ts
const handleOpenPath = useCallback(
  async (path: string) => {
    const text = await invoke<string>("read_file", { path });
    openDocument({ content: text, filePath: path, isDirty: false });
  },
  [openDocument],
);
```

Update `handleOpen` to delegate to `handleOpenPath`:

```ts
const handleOpen = useCallback(async () => {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
  });

  if (typeof selected === "string") {
    await handleOpenPath(selected);
  }
}, [handleOpenPath]);
```

- [ ] **Step 2: Add drag-drop listener (getCurrentWindow import is already present from Task 2)**

Add a drag-drop effect after the scroll sync effect:

```ts
useEffect(() => {
  let unlisten: (() => void) | undefined;

  void getCurrentWindow()
    .onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        const mdPaths = event.payload.paths.filter((p) =>
          /\.(md|markdown|txt)$/i.test(p),
        );
        for (const path of mdPaths) {
          void handleOpenPath(path);
        }
      }
    })
    .then((fn) => {
      unlisten = fn;
    });

  return () => {
    unlisten?.();
  };
}, [handleOpenPath]);
```

- [ ] **Step 3: Verify manually**

Run `npm run tauri dev`. Drag a `.md` file from Windows Explorer onto the app window. It should open in a new tab without replacing the current document.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: open markdown files by dragging them onto the app window"
```

---

## Task 9: Session Restore

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add session save effect**

`openDocuments` is already destructured from `useDocumentStore()` in App.tsx. Add a session-save effect that runs whenever open documents change:

```ts
useEffect(() => {
  const paths = openDocuments
    .filter((tab) => tab.filePath !== null)
    .map((tab) => tab.filePath as string);
  localStorage.setItem("markora-session-files", JSON.stringify(paths));
}, [openDocuments]);
```

- [ ] **Step 2: Add session restore effect**

Add a session-restore effect that runs once on mount. It reads the saved file paths, reopens each one, and removes the initial welcome tab if any files were restored:

```ts
useEffect(() => {
  const raw = localStorage.getItem("markora-session-files");
  if (!raw) return;

  let paths: string[];
  try {
    paths = JSON.parse(raw) as string[];
  } catch {
    return;
  }

  if (!Array.isArray(paths) || paths.length === 0) return;

  let cancelled = false;

  const restoreAll = async () => {
    const results = await Promise.allSettled(
      paths.map(async (path) => {
        const content = await invoke<string>("read_file", { path });
        return { path, content };
      }),
    );

    if (cancelled) return;

    const valid = results
      .filter(
        (r): r is PromiseFulfilledResult<{ path: string; content: string }> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    if (valid.length === 0) return;

    for (const { path, content } of valid) {
      openDocument({ filePath: path, content, isDirty: false });
    }

    // Close the initial welcome tab if it is still untitled.
    const { openDocuments: docs } = useDocumentStore.getState();
    const welcomeDoc = docs.find((d) => d.id === "document-1" && !d.filePath);
    if (welcomeDoc) closeDocument(welcomeDoc.id);
  };

  void restoreAll();

  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // intentionally runs only on mount
```

- [ ] **Step 3: Verify manually**

Run `npm run tauri dev`. Open two `.md` files. Close the app. Re-launch — both files should reopen and the welcome tab should be gone. Delete the localStorage key and restart — the welcome tab should appear as normal.

To clear the session manually during testing:
```
localStorage.removeItem("markora-session-files")
```
(paste in browser devtools, Tauri exposes a devtools window via `Ctrl+Shift+I` in dev mode)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restore previously open files on app launch"
```

---

## Self-Review

**Spec coverage:** All 9 UX recommendations are covered:
1. Default split view → Task 1
2. Window title = current filename → Task 2
3. Untitled tab numbering → Task 3
4. View mode to footer + unify top bar → Task 4
5. Toolbar hidden by default + Ctrl+Shift+T → Task 5
6. Focus mode (F11) → Task 6
7. Scroll sync in split view → Task 7
8. Drag and drop to open files → Task 8
9. Session restore → Task 9

**Placeholder scan:** No TBD, TODO, or placeholder steps. All code blocks contain complete implementations.

**Type consistency:**
- `EditorPaneHandle` — defined in Task 7 Step 1, re-exported in Step 2, imported in App.tsx Step 4
- `useToolbarStore` — defined in Task 5 Step 3, used in top-bar.tsx Step 5, imported in App.tsx Step 7
- `useFocusModeStore` — defined in Task 6 Step 3, used in app-shell.tsx Step 5, imported in App.tsx Step 7
- `handleOpenPath` — defined in Task 8 Step 1, reused in `handleOpen` Step 1, reused in drag-drop Step 2

---

Plan complete and saved to `docs/superpowers/plans/2026-03-27-ux-improvements.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
