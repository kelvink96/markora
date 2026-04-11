# Markora Toolbar Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current top chrome with a one-row segmented command bar that separates document identity, menu commands, and utilities while preserving current file and theme behavior.

**Architecture:** Keep the existing `App.tsx` command handlers and document store logic intact. Refactor the top-bar layer into a segmented layout backed by reusable menu-bar components so the same command model can later support both one-row and two-row toolbar presentations.

**Tech Stack:** Tauri v2 · React · TypeScript · Zustand · Radix Dropdown Menu · CSS · Vitest

---

## Task 1: Add menu-bar primitives for segmented command groups

**Files:**
- Create: `src/components/shared/menu-bar/menu-bar.tsx`
- Create: `src/components/shared/menu-bar/menu-bar.css`
- Create: `src/components/shared/menu-bar/menu-bar.test.tsx`
- Create: `src/components/shared/menu-bar/index.ts`

**Step 1: Write the failing test**

```tsx
it("renders a menu trigger and opens its items", async () => {
  render(
    <MenuBar
      groups={[
        {
          label: "File",
          items: [{ label: "New", onSelect: vi.fn() }],
        },
      ]}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "File" }));

  expect(screen.getByRole("menuitem", { name: "New" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/menu-bar/menu-bar.test.tsx`

Expected: FAIL because the menu-bar component does not exist yet.

**Step 3: Write minimal implementation**

```tsx
export interface MenuBarGroup {
  label: string;
  items: Array<{ label: string; onSelect?: () => void; disabled?: boolean }>;
}

export function MenuBar({ groups }: { groups: MenuBarGroup[] }) {
  return (
    <nav className="menu-bar" aria-label="Application menu">
      {groups.map((group) => (
        <DropdownMenu.Root key={group.label}>
          <DropdownMenu.Trigger asChild>
            <button className="menu-bar__trigger" type="button">
              {group.label}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="menu-bar__content" sideOffset={8}>
            {group.items.map((item) => (
              <DropdownMenu.Item key={item.label} asChild disabled={item.disabled}>
                <button className="menu-bar__item" type="button" onClick={item.onSelect}>
                  {item.label}
                </button>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ))}
    </nav>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/menu-bar/menu-bar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/menu-bar/menu-bar.tsx src/components/shared/menu-bar/menu-bar.css src/components/shared/menu-bar/menu-bar.test.tsx src/components/shared/menu-bar/index.ts
git commit -m "feat: add segmented menu bar primitives"
```

---

## Task 2: Refactor the top bar into three visible zones

**Files:**
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.css`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Modify: `src/components/editor-page/document-status/document-status.tsx`
- Modify: `src/components/editor-page/document-status/document-status.css`

**Step 1: Write the failing test**

```tsx
it("renders document, menu, and utility zones", () => {
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

  expect(screen.getByTestId("top-bar-document")).toBeInTheDocument();
  expect(screen.getByTestId("top-bar-menu")).toBeInTheDocument();
  expect(screen.getByTestId("top-bar-utilities")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL because the current top bar has no menu zone or multiple menu triggers.

**Step 3: Write minimal implementation**

Use the new `MenuBar` in the center zone and keep `DocumentStatus`, `WordCount`, `LivePreviewIndicator`, and `ThemeToggle` in the left/right zones.

```tsx
const menuGroups = [
  { label: "File", items: [...] },
  { label: "Edit", items: [...] },
  { label: "View", items: [...] },
  { label: "Help", items: [...] },
];

<header className="top-bar">
  <div className="top-bar__document" data-testid="top-bar-document">...</div>
  <div className="top-bar__menu" data-testid="top-bar-menu">
    <MenuBar groups={menuGroups} />
  </div>
  <div className="top-bar__utilities" data-testid="top-bar-utilities">...</div>
</header>
```

Also simplify `DocumentStatus` styling so it supports a compact one-row chrome more naturally.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.css src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.tsx src/components/editor-page/document-status/document-status.css src/components/editor-page/document-status/document-status.test.tsx
git commit -m "feat: refactor top bar into segmented toolbar"
```

---

## Task 3: Move file actions into the File menu and remove the old file button

**Files:**
- Modify: `src/components/shared/file-menu/file-menu.tsx`
- Modify: `src/components/shared/file-menu/file-menu.css`
- Modify: `src/components/shared/file-menu/file-menu.test.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`

**Step 1: Write the failing test**

```tsx
it("invokes file actions from the File menu", async () => {
  const onOpen = vi.fn();

  render(
    <TopBar
      fileName="notes.md"
      isDirty={false}
      wordCount={12}
      theme="light"
      onThemeToggle={vi.fn()}
      onNew={vi.fn()}
      onOpen={onOpen}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "File" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Open" }));

  expect(onOpen).toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "File actions" })).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/shared/file-menu/file-menu.test.tsx`

Expected: FAIL because the top bar still relies on the old `FileMenu` trigger button.

**Step 3: Write minimal implementation**

Either:
- remove `FileMenu` completely and fold its items into the generic `MenuBar`, or
- repurpose `FileMenu` to provide shared item definitions without its own trigger

Preferred minimal implementation:

```tsx
const fileItems = [
  { label: "New", onSelect: onNew },
  { label: "Open", onSelect: onOpen },
  { label: "Save", onSelect: onSave },
  { label: "Save As", onSelect: onSaveAs },
];
```

Then pass `fileItems` into the `File` group inside `TopBar`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/shared/file-menu/file-menu.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/file-menu/file-menu.tsx src/components/shared/file-menu/file-menu.css src/components/shared/file-menu/file-menu.test.tsx src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx
git commit -m "feat: move file actions into file menu group"
```

---

## Task 4: Define lean Edit, View, and Help menu behavior

**Files:**
- Modify: `src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `src/components/editor-page/top-bar/top-bar.test.tsx`
- Modify: `src/components/shared/menu-bar/menu-bar.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders lean secondary menus for future growth", async () => {
  render(
    <TopBar
      fileName="notes.md"
      isDirty={false}
      wordCount={12}
      theme="light"
      onThemeToggle={vi.fn()}
      onNew={vi.fn()}
      onOpen={vi.fn()}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "View" }));

  expect(screen.getByRole("menuitem", { name: "Theme" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Live Preview" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL because `View` and the other menus have no defined items yet.

**Step 3: Write minimal implementation**

Start with a lean but coherent command set:

- `Edit`: `Undo`, `Redo` as disabled placeholders if behavior does not exist yet
- `View`: `Theme`, `Live Preview`
- `Help`: `Keyboard Shortcuts`, `About Markora` as disabled placeholders if not wired

Use existing handlers where possible. For example, `Theme` can reuse `onThemeToggle`.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx src/components/shared/menu-bar/menu-bar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/shared/menu-bar/menu-bar.test.tsx
git commit -m "feat: add lean editor menu groups"
```

---

## Task 5: Restyle the toolbar for light and dark coherence

**Files:**
- Modify: `src/components/editor-page/top-bar/top-bar.css`
- Modify: `src/components/shared/menu-bar/menu-bar.css`
- Modify: `src/components/shared/word-count/word-count.css`
- Modify: `src/components/shared/live-preview-indicator/live-preview-indicator.css`
- Modify: `src/components/shared/theme-toggle/theme-toggle.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/globals.css`

**Step 1: Write the failing test**

```tsx
it("keeps compact utility controls visible beside the menu bar", () => {
  render(
    <TopBar
      fileName="notes.md"
      isDirty={false}
      wordCount={23}
      theme="dark"
      onThemeToggle={vi.fn()}
      onNew={vi.fn()}
      onOpen={vi.fn()}
      onSave={vi.fn()}
      onSaveAs={vi.fn()}
    />,
  );

  expect(screen.getByText("23 words")).toBeVisible();
  expect(screen.getByText("Live Preview")).toBeVisible();
  expect(screen.getByRole("switch")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: FAIL if the top-bar refactor or style pass hides or removes compact utility elements.

**Step 3: Write minimal implementation**

Use CSS only to make the toolbar feel like one anchored editor command surface:

- stronger segmented grouping
- flatter, less glossy surfaces
- improved dark-mode contrast without washed-out utilities
- menu triggers that feel like editor commands, not generic buttons
- utility zone that stays secondary to the center menu zone

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/top-bar/top-bar.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/top-bar/top-bar.css src/components/shared/menu-bar/menu-bar.css src/components/shared/word-count/word-count.css src/components/shared/live-preview-indicator/live-preview-indicator.css src/components/shared/theme-toggle/theme-toggle.css src/styles/tokens.css src/styles/globals.css
git commit -m "feat: polish segmented toolbar themes"
```

---

## Task 6: Verify integration and record QA

**Files:**
- Modify: `docs/plans/2026-03-27-markora-toolbar-redesign-implementation.md`

**Step 1: Run focused toolbar tests**

Run: `npx vitest run src/components/shared/menu-bar/menu-bar.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.test.tsx src/components/shared/file-menu/file-menu.test.tsx`

Expected: PASS

**Step 2: Run full frontend tests**

Run: `npx vitest run`

Expected: PASS

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`

Expected: PASS

**Step 4: Run manual app QA**

Run: `npm run tauri dev`

Expected:
- one-row segmented toolbar is visually coherent in light and dark modes
- menu dropdowns open reliably
- `File` commands still work
- utility controls remain visible and readable

**Step 5: Record QA checklist**

```md
## QA Notes

- [ ] `npx vitest run src/components/shared/menu-bar/menu-bar.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx src/components/editor-page/document-status/document-status.test.tsx src/components/shared/file-menu/file-menu.test.tsx`
- [ ] `npx vitest run`
- [ ] `npx tsc --noEmit`
- [ ] `npm run tauri dev`
- [ ] Light theme checked
- [ ] Dark theme checked
- [ ] File menu commands checked
```
