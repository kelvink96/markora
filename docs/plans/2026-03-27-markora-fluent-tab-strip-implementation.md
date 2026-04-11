# Markora Fluent Tab Strip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle the tab strip with Fluent-inspired acrylic surfaces while preserving tab behavior and accessibility.

**Architecture:** Keep the refresh contained to the shared token layer and the tab strip component. Preserve the existing tab selection and close/new actions so the change is visual-first and low risk.

**Tech Stack:** React, TypeScript, Tailwind v4 utilities, Vitest, Testing Library

---

### Task 1: Lock in the tab strip visual contract with tests

**Files:**
- Modify: `src/components/editor-page/tab-strip/tab-strip.test.tsx`

**Step 1: Write the failing test**

Add assertions for:
- the acrylic rail container class
- an active tab modifier class
- an inactive tab modifier class
- the integrated new-tab button class

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx`

Expected: FAIL because the new acrylic classes do not exist yet.

### Task 2: Add acrylic tab tokens

**Files:**
- Modify: `src/styles/tailwind.css`

**Step 1: Add token values**

Add tab-specific variables for:
- rail surface
- rail border
- inactive tab fill
- active tab fill
- active inner highlight
- acrylic hover tint
- elevated tab shadow

**Step 2: Keep both themes aligned**

Add light and dark theme values so the tab strip keeps the same hierarchy across themes.

### Task 3: Restyle the tab strip component

**Files:**
- Modify: `src/components/editor-page/tab-strip/tab-strip.tsx`

**Step 1: Update the rail**

Apply the new acrylic rail styling and preserve the current tablist semantics.

**Step 2: Update tab surfaces**

Add explicit active and inactive modifier classes while preserving selection and close behavior.

**Step 3: Update the new-tab action**

Style the new-tab button as part of the rail with matching acrylic affordances.

### Task 4: Verify

**Files:**
- Test: `src/components/editor-page/tab-strip/tab-strip.test.tsx`

**Step 1: Run focused tests**

Run: `npx vitest run src/components/editor-page/tab-strip/tab-strip.test.tsx`

Expected: PASS

**Step 2: Run app-level guardrail**

Run: `npx vitest run src/App.test.tsx`

Expected: PASS
