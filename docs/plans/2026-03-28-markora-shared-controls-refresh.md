# Markora Shared Controls Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh Markora's shared control language by introducing reusable control styling rules and applying them first to `Select` and `Checkbox`, creating a foundation for later updates across the rest of the shared UI primitives.

**Architecture:** Keep the implementation localized to the shared primitive layer and theme stylesheet. Define a small reusable control styling foundation in the theme, then update `Select` and `Checkbox` to consume it without changing their public behavior contracts. Use this first pass to set patterns that later shared components can adopt incrementally.

**Tech Stack:** React, TypeScript, Tailwind CSS v4 utilities, Vitest, Testing Library

---

### Task 1: Audit the existing control patterns and confirm the first-pass files

**Files:**
- Inspect: `D:/works/design-sparx/markora/src/components/shared/select/select.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/select/select.test.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.test.tsx`
- Inspect: `D:/works/design-sparx/markora/src/styles/tailwind.css`

**Step 1: Read the current component and theme files**

Confirm:

- how `Select` composes through `Field`
- how `Checkbox` exposes its current label contract
- what tests already exist for structure and behavior
- which theme tokens already support borders, surfaces, accents, and shadows

**Step 2: Capture the reusable control rules**

Write down the first-pass rules to carry into code:

- common control height rhythm
- border and radius behavior
- hover and focus treatment
- checked and selected accent usage
- disabled-state behavior

**Step 3: Commit**

No commit in this task. This is orientation work before TDD begins.

### Task 2: Add failing tests for the refreshed Select structure

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/select/select.test.tsx`

**Step 1: Write the failing test**

Extend `select.test.tsx` to assert:

- the control still renders with its label through `Field`
- the select remains accessible by label
- the rendered control includes the new presentational hook for the custom affordance area or icon wrapper
- helper and message content still render when provided

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/select/select.test.tsx`
Expected: FAIL because the new structure is not implemented yet.

**Step 3: Commit**

No commit yet. Keep moving through the TDD cycle.

### Task 3: Implement the minimal Select refresh

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/select/select.tsx`
- Modify: `D:/works/design-sparx/markora/src/styles/tailwind.css`

**Step 1: Write minimal implementation**

Update `select.tsx` to:

- preserve the existing public props and native `select` behavior
- add a wrapper or affordance element for a custom chevron treatment
- increase the visual structure of the control using shared theme-driven classes
- keep the control accessible and label-linked through `Field`

Update `tailwind.css` to:

- define any small reusable control tokens or CSS patterns needed for this pass
- support solid control surfaces, clearer borders, and unified focus language

**Step 2: Run the Select test to verify it passes**

Run: `npx vitest run src/components/shared/select/select.test.tsx`
Expected: PASS

**Step 3: Refactor**

Clean up any repeated class logic so the control styling foundation will be reusable for future primitives.

**Step 4: Run the Select test again**

Run: `npx vitest run src/components/shared/select/select.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/select/select.tsx src/components/shared/select/select.test.tsx src/styles/tailwind.css
git commit -m "feat: refresh shared select control"
```

### Task 4: Add failing tests for the refreshed Checkbox structure

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.test.tsx`

**Step 1: Write the failing test**

Extend `checkbox.test.tsx` to assert:

- the checkbox remains accessible by its label
- checked state is still reflected correctly
- disabled state is still reflected correctly
- the rendered control includes the new themed presentation wrapper for the custom checkbox box or glyph

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/shared/checkbox/checkbox.test.tsx`
Expected: FAIL because the custom structure is not implemented yet.

**Step 3: Commit**

No commit yet. Keep the red-green cycle intact.

### Task 5: Implement the minimal Checkbox refresh

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/shared/checkbox/checkbox.tsx`
- Modify: `D:/works/design-sparx/markora/src/styles/tailwind.css`

**Step 1: Write minimal implementation**

Update `checkbox.tsx` to:

- preserve the existing label-first API
- keep the native checkbox input for semantics and state
- add themed presentational elements for the custom box and check glyph
- stop relying on native `accent-color` as the primary visual treatment

Update `tailwind.css` only as needed to:

- reuse the shared control styling foundation from the select work
- support checked, disabled, and focus-visible presentation cleanly

**Step 2: Run the Checkbox test to verify it passes**

Run: `npx vitest run src/components/shared/checkbox/checkbox.test.tsx`
Expected: PASS

**Step 3: Refactor**

Remove duplication and make sure the visual rules still align with the shared control language set by `Select`.

**Step 4: Run the Checkbox test again**

Run: `npx vitest run src/components/shared/checkbox/checkbox.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/shared/checkbox/checkbox.tsx src/components/shared/checkbox/checkbox.test.tsx src/styles/tailwind.css
git commit -m "feat: refresh shared checkbox control"
```

### Task 6: Run focused verification for the first pass

**Files:**
- Modify: touched files as needed

**Step 1: Run focused tests**

Run: `npx vitest run src/components/shared/select/select.test.tsx src/components/shared/checkbox/checkbox.test.tsx`
Expected: PASS

**Step 2: Run TypeScript checks**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Review color-scheme compatibility**

Verify the new styles remain legible for:

- standard light and dark
- sepia light and dark
- high-contrast light and dark

This can be done through existing preview/test workflow or local manual inspection if needed.

**Step 4: Commit**

```bash
git add src/components/shared/select src/components/shared/checkbox src/styles/tailwind.css
git commit -m "test: verify shared control refresh"
```

### Task 7: Prepare the wider shared-primitives follow-up

**Files:**
- Inspect: `D:/works/design-sparx/markora/src/components/shared/button/button.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/switch/switch.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/tab/tab.tsx`
- Inspect: `D:/works/design-sparx/markora/src/components/shared/segmented-control/segmented-control.tsx`

**Step 1: Note carry-forward opportunities**

Capture which of the new shared control rules should next be applied to:

- action controls
- toggle controls
- selection controls
- menu and dialog surfaces

**Step 2: Do not implement follow-on work in this task**

This plan's implementation scope ends after the first pass. Use the established rules to guide the next design and plan cycle for the broader shared library refresh.

## Notes For The Implementer

- Keep `Select` native for now; do not replace it with a custom popover menu.
- Preserve existing public props for `Select` and `Checkbox`.
- Prefer reusable theme-driven control styling over one-off component-only tweaks.
- Keep tests focused on behavior and structure, not fragile class snapshots.
- Treat this pass as the control-language foundation for the wider shared component refresh.
