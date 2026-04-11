# Markora Shared UI Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a shared UI library for Markora with singular component names, variant-based typography primitives, separated selection and navigation controls, and a small set of compound components for the current app shell.

**Architecture:** Add shared foundation components under `src/components/shared/` for typography, actions, selection, navigation, and surfaces, then compose them into app-specific compound components. Migrate the settings page and editor shell in small TDD-driven slices so shared primitives own visual and accessibility behavior while feature components keep only layout and workflow logic.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, Testing Library, Radix UI, lucide-react

---

### Task 1: Add typography primitives

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/title/title.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/title/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/title/title.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/text/text.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/text/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/text/text.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Title` renders sensible default semantics
- `Title` supports `as`, `size`, `tone`, and truncation variants
- `Text` supports `as`, `size`, `tone`, `weight`, and truncation variants
- shared typography defaults do not require callers to pass raw class strings

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/title/title.test.tsx src/components/shared/text/text.test.tsx`
Expected: FAIL because the components do not exist yet.

**Step 3: Write minimal implementation**

Create `Title` and `Text` as small polymorphic components with:

- a constrained variant API
- semantic defaults
- no unnecessary memoization
- explicit class composition without `transition: all`

Keep the implementation simple and app-specific rather than building a generic polymorphic utility framework.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/title/title.test.tsx src/components/shared/text/text.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/title src/components/shared/text
git commit -m "feat: add shared typography primitives"
```

### Task 2: Add a shared Button and align IconButton with it

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/button/button.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/button/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/button/button.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/icon-button/icon-button.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/icon-button/icon-button.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Button` supports `primary`, `secondary`, `ghost`, and `danger`
- `Button` supports small and default sizes
- `IconButton` still requires an accessible label
- `IconButton` visually aligns with shared button variants instead of maintaining a separate styling system

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/button/button.test.tsx src/components/shared/icon-button/icon-button.test.tsx`
Expected: FAIL because `Button` does not exist and `IconButton` is not yet aligned.

**Step 3: Write minimal implementation**

Create `Button` and refactor `IconButton` to share the same class and variant vocabulary where practical.

Keep `IconButton` separate from `Button`; do not overload `Button` with icon-only behavior flags that make the API muddy.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/button/button.test.tsx src/components/shared/icon-button/icon-button.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/button src/components/shared/icon-button
git commit -m "feat: add shared button primitives"
```

### Task 3: Migrate shared typography and actions into the settings page shell

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx`

**Step 1: Write the failing test**

Extend tests to assert:

- settings headings and descriptive copy still render correctly after adopting `Title` and `Text`
- the back action and save/reset actions still work after adopting `Button`

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: FAIL after expectations are updated to cover shared component adoption.

**Step 3: Write minimal implementation**

Refactor the obvious settings-page headings, descriptions, and action buttons to use:

- `Title`
- `Text`
- `Button`

Do not extract every settings helper yet. Keep this task focused on proving the typography and button API against a real screen.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings-page/settings-page.tsx src/components/settings-page/settings-page.test.tsx
git commit -m "refactor: adopt shared typography in settings"
```

### Task 4: Add form foundations with separate Select, Checkbox, Switch, and Field

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/select/select.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/select/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/select/select.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/checkbox/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/switch/switch.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/switch/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/switch/switch.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/field/field.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/field/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/field/field.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Select` renders label-friendly markup and accepts native select props
- `Checkbox` renders a single accessible hit area with its label
- `Switch` is distinct from `Checkbox` in API and rendering
- `Field` renders label, helper text, and control composition cleanly

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/select/select.test.tsx src/components/shared/checkbox/checkbox.test.tsx src/components/shared/switch/switch.test.tsx src/components/shared/field/field.test.tsx`
Expected: FAIL because the components do not exist yet.

**Step 3: Write minimal implementation**

Implement each control as its own component with a narrow, intentional API.

Do not merge `Checkbox` and `Switch` into a shared boolean component.

Prefer semantic HTML and label behavior first. Only add abstraction when it removes real duplication.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/select/select.test.tsx src/components/shared/checkbox/checkbox.test.tsx src/components/shared/switch/switch.test.tsx src/components/shared/field/field.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/select src/components/shared/checkbox src/components/shared/switch src/components/shared/field
git commit -m "feat: add shared form controls"
```

### Task 5: Migrate settings controls onto Field and shared form components

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx`

**Step 1: Write the failing test**

Extend settings tests to assert:

- appearance selects still update state
- checkbox-like settings controls remain labeled and clickable
- helper copy still appears in the right section

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: FAIL if the current expectations do not cover the new shared composition yet.

**Step 3: Write minimal implementation**

Refactor the settings page to use:

- `Field`
- `Select`
- `Checkbox`
- `Switch` where the immediate-toggle semantics make sense

Keep the settings data flow unchanged. This task is about presentation and accessibility consistency, not state redesign.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings-page/settings-page.tsx src/components/settings-page/settings-page.test.tsx
git commit -m "refactor: use shared settings controls"
```

### Task 6: Add distinct navigation primitives for Tab and SegmentedControl

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/tab/tab.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/tab/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/tab/tab.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/segmented-control/segmented-control.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/segmented-control/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/segmented-control/segmented-control.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/view-mode-switcher/view-mode-switcher.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/view-mode-switcher/view-mode-switcher.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `SegmentedControl` renders a single selected option
- keyboard and click behavior are preserved for mode switching
- `Tab` exists as a separate primitive and does not reuse `SegmentedControl` props blindly

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/tab/tab.test.tsx src/components/shared/segmented-control/segmented-control.test.tsx src/components/editor-page/view-mode-switcher/view-mode-switcher.test.tsx`
Expected: FAIL because the new primitives do not exist yet.

**Step 3: Write minimal implementation**

Implement `SegmentedControl` for the current view mode switcher and add `Tab` as a separate primitive for document-style navigation.

Refactor `ViewModeSwitcher` to consume `SegmentedControl`.

Do not refactor `TabStrip` in this task because the worktree already contains unrelated edits there.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/tab/tab.test.tsx src/components/shared/segmented-control/segmented-control.test.tsx src/components/editor-page/view-mode-switcher/view-mode-switcher.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/tab src/components/shared/segmented-control src/components/editor-page/view-mode-switcher/view-mode-switcher.tsx src/components/editor-page/view-mode-switcher/view-mode-switcher.test.tsx
git commit -m "feat: add shared navigation controls"
```

### Task 7: Add StatusBadge and adopt shared typography in status areas

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/status-badge/status-badge.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/status-badge/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/status-badge/status-badge.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/document-status/document-status.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/document-status/document-status.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/footer-status-bar/footer-status-bar.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `StatusBadge` renders semantic status content with tone variants
- document saved and unsaved state still renders correctly
- footer metadata remains readable after typography migration

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/status-badge/status-badge.test.tsx src/components/editor-page/document-status/document-status.test.tsx src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx`
Expected: FAIL because `StatusBadge` does not exist yet.

**Step 3: Write minimal implementation**

Implement `StatusBadge` and use it where it clarifies state presentation.

Migrate obvious metadata text in the document and footer status areas onto `Title` and `Text` where appropriate.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/status-badge/status-badge.test.tsx src/components/editor-page/document-status/document-status.test.tsx src/components/editor-page/footer-status-bar/footer-status-bar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/status-badge src/components/editor-page/document-status src/components/editor-page/footer-status-bar
git commit -m "feat: add shared status badge"
```

### Task 8: Add surface primitives with Card and Panel

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/card/card.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/card/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/card/card.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/panel/panel.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/panel/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/panel/panel.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Card` and `Panel` render distinct surface treatments
- settings section surfaces still render correctly after migration
- editor and preview surfaces keep their structural test hooks

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/card/card.test.tsx src/components/shared/panel/panel.test.tsx src/components/settings-page/settings-page.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Expected: FAIL because the surface primitives do not exist yet.

**Step 3: Write minimal implementation**

Implement `Card` and `Panel` and migrate the largest repeated shell surfaces that are safe to change without affecting editor behavior.

Keep layout ownership in the feature components. Use the new surface primitives only for shared containment styling.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/card/card.test.tsx src/components/shared/panel/panel.test.tsx src/components/settings-page/settings-page.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/card src/components/shared/panel src/components/settings-page/settings-page.tsx src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/preview-pane/preview-pane.tsx
git commit -m "feat: add shared surface components"
```

### Task 9: Add compound Menu, Dialog, and Toolbar primitives

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/shared/menu/menu.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/menu/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/menu/menu.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/dialog/dialog.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/dialog/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/dialog/dialog.test.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/toolbar/toolbar.tsx`
- Create: `D:/works/design-sparx/markora/src/components/shared/toolbar/index.ts`
- Create: `D:/works/design-sparx/markora/src/components/shared/toolbar/toolbar.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/menu-bar/menu-bar.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx`

**Step 1: Write the failing test**

Add tests that assert:

- `Menu` exposes reusable trigger, content, and item composition
- `Toolbar` provides a shared container contract for icon actions
- formatting toolbar behavior is preserved after adopting the new shared toolbar
- `Dialog` renders accessible title, content, and actions even if it is not fully wired into a feature yet

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/menu/menu.test.tsx src/components/shared/dialog/dialog.test.tsx src/components/shared/toolbar/toolbar.test.tsx src/components/shared/menu-bar/menu-bar.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx`
Expected: FAIL because the new compound components do not exist yet.

**Step 3: Write minimal implementation**

Implement `Menu`, `Dialog`, and `Toolbar` with the current app shell in mind.

Refactor `MenuBar` to consume shared menu styling and `FormattingToolbar` to consume shared toolbar styling.

Keep `Dialog` ready for future confirmations even if the first migration does not replace every browser confirm yet.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/menu/menu.test.tsx src/components/shared/dialog/dialog.test.tsx src/components/shared/toolbar/toolbar.test.tsx src/components/shared/menu-bar/menu-bar.test.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/menu src/components/shared/dialog src/components/shared/toolbar src/components/shared/menu-bar/menu-bar.tsx src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx
git commit -m "feat: add shared compound ui components"
```

### Task 10: Run final verification and clean up drift

**Files:**
- Modify: touched shared component files as needed
- Modify: touched feature component files as needed

**Step 1: Run the shared component and feature tests**

Run: `npx vitest run`
Expected: PASS

**Step 2: Run TypeScript checks**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Manually smoke-check the shell**

Run: `npm run dev`
Expected:

- settings page still renders correctly
- top bar actions still render with visible focus states
- view mode switching still works
- editor and preview surfaces still display correctly
- status areas remain readable in current themes and color schemes

**Step 4: Review for guideline drift**

Check the touched components against the Vercel React best-practices and latest Vercel web interface guidelines:

- semantic headings and labels remain intact
- icon buttons keep accessible labels
- no `transition: all`
- focus-visible treatments remain obvious
- truncation and `min-w-0` remain intact where text is constrained

**Step 5: Commit**

```bash
git add src/components
git commit -m "test: verify shared ui library rollout"
```

## Notes For The Implementer

- Keep component names singular everywhere, including file and export names.
- Do not merge conceptually different controls just because they share visuals. `Checkbox` and `Switch` are distinct. `Tab` and `SegmentedControl` are distinct.
- `Title` and `Text` should be visually opinionated but semantically flexible through `as`.
- Avoid generic abstraction helpers that add complexity without removing real duplication.
- Prefer direct imports over new barrel-heavy patterns when adding components.
- Do not touch `D:/works/design-sparx/markora/src/components/editor-page/tab-strip/tab-strip.tsx` in the early rollout unless the existing unrelated work is resolved first.
- Keep commit messages conventional to satisfy commitlint.
