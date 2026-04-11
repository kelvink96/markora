# Markora Tab And Button Section Slots Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the shared `Button` and `Tab` components with optional `leftSection` and `rightSection` props, then migrate `TabStrip` so the close action lives inside the shared `Tab` layout.

**Architecture:** Keep the slot API small and consistent across `Button` and `Tab` by adding shared side-content wrappers inside each component. Preserve the main child content as the primary label, and use the new `Tab.rightSection` to absorb the close action in `TabStrip` without changing the existing local visual direction.

**Tech Stack:** React, TypeScript, Vitest, Testing Library

---

### Task 1: Add section slot support to Button

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/button/button.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/button/button.test.tsx`

**Step 1: Write the failing test**

Extend `button.test.tsx` to assert:

- `Button` renders `leftSection`
- `Button` renders `rightSection`
- the main button label remains present and centered as the primary content

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/button/button.test.tsx`
Expected: FAIL because slot props do not exist yet.

**Step 3: Write minimal implementation**

Update `button.tsx` to:

- accept `leftSection` and `rightSection`
- render consistent internal wrappers
- preserve existing button variants and sizes
- keep the center content in a `min-w-0` wrapper

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/button/button.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/button/button.tsx src/components/shared/button/button.test.tsx
git commit -m "feat: add button section slots"
```

### Task 2: Add section slot support to Tab

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/tab/tab.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/shared/tab/tab.test.tsx`

**Step 1: Write the failing test**

Extend `tab.test.tsx` to assert:

- `Tab` renders `leftSection`
- `Tab` renders `rightSection`
- the main label remains the tab name

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/tab/tab.test.tsx`
Expected: FAIL because slot props do not exist yet.

**Step 3: Write minimal implementation**

Update `tab.tsx` to:

- accept `leftSection` and `rightSection`
- render the internal slot wrappers
- keep the center content truncation-safe
- preserve current tab role and active styling

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/shared/tab/tab.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/tab/tab.tsx src/components/shared/tab/tab.test.tsx
git commit -m "feat: add tab section slots"
```

### Task 3: Migrate TabStrip to use Tab.rightSection

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/tab-strip/tab-strip.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/tab-strip/tab-strip.test.tsx`

**Step 1: Write the failing test**

Extend `tab-strip.test.tsx` to assert:

- the close button lives inside the tab item composition
- clicking the tab still selects it
- clicking the close action does not also trigger tab selection

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx`
Expected: FAIL because the close button still sits outside the shared tab layout.

**Step 3: Write minimal implementation**

Refactor `tab-strip.tsx` so:

- the tab label remains `children`
- the close button moves into `rightSection`
- the local visual choices already present in the file remain intact
- close clicks stop propagation so tab selection does not also fire

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/editor-page/tab-strip/tab-strip.tsx src/components/editor-page/tab-strip/tab-strip.test.tsx
git commit -m "refactor: compose tab strip actions within tabs"
```

### Task 4: Run final verification

**Files:**
- Modify: touched files as needed

**Step 1: Run focused tests**

Run: `npx vitest run src/components/shared/button/button.test.tsx src/components/shared/tab/tab.test.tsx src/components/editor-page/tab-strip/tab-strip.test.tsx`
Expected: PASS

**Step 2: Run TypeScript checks**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/shared/button src/components/shared/tab src/components/editor-page/tab-strip
git commit -m "test: verify tab and button section slots"
```

## Notes For The Implementer

- Keep the slot names exactly `leftSection` and `rightSection`.
- Do not replace `children` with a separate `label` prop.
- Preserve the current local `TabStrip` styling choices already present in the file.
- The center content wrapper should keep `min-w-0` so long tab names still truncate correctly.
- Keep commit messages conventional to satisfy commitlint.
