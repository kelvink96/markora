# Markora UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Markora from generic dark editor to a distinctive writing tool by introducing a brand accent color, a visible active-tab indicator, and a compact sidebar layout.

**Architecture:** Three isolated changes: (1) CSS custom-property values for the standard color scheme, (2) a visual indicator added to the `Tab` primitive, (3) layout and active-state tweaks inside `WorkspaceSidebar`. Each change is self-contained and testable independently.

**Tech Stack:** React, Tailwind CSS v4 (via CSS custom properties), Vitest + Testing Library.

---

## File Map

| File | Change |
|---|---|
| `src/styles/tailwind.css` | Replace `--accent` / `--accent-strong` neutral grays in the `standard` scheme with a teal-sage hue |
| `src/styles/theme-fonts.test.ts` | Update assertion that hardcodes the old `#b9b9b9` neutral accent value |
| `src/components/shared/tab/tab.tsx` | Add `relative` positioning + `after:` pseudo pill indicator on the active tab |
| `src/components/shared/tab/tab.test.tsx` | Assert the `relative` class exists and the active indicator is present |
| `src/components/editor-page/workspace-sidebar/workspace-sidebar.tsx` | Change action buttons from full-width stacked to 2-column compact grid; replace full-border active state with a left-border + subtle fill |

---

## Task 1: Brand accent color — standard color scheme

The standard light scheme uses `--accent: #6b6b6b` (dark gray) and the dark scheme uses `--accent: #b9b9b9` (light gray). This makes the entire accent system — focus rings, selected states, hover tints — visually inert. We introduce a teal-sage hue that distinguishes Markora from the sepia (amber) and high-contrast (blue) schemes.

**Files:**
- Modify: `src/styles/tailwind.css` (lines 159–193 standard light, lines 195–230 standard dark)
- Modify: `src/styles/theme-fonts.test.ts` (line 52)

- [ ] **Step 1: Update the standard light accent tokens in `tailwind.css`**

Find this block (starts around line 159):
```css
:root,
:root[data-color-scheme="standard"][data-theme-mode="light"],
.scheme-swatch[data-color-scheme="standard"][data-theme-mode="light"] {
```

Replace these two lines inside that block:
```css
    --accent: #6b6b6b;
    --accent-strong: #3f3f3f;
```
With:
```css
    --accent: #4a7c6e;
    --accent-strong: #2d5d52;
```

- [ ] **Step 2: Update the standard dark accent tokens in `tailwind.css`**

Find this block (starts around line 195):
```css
  :root[data-color-scheme="standard"][data-theme-mode="dark"],
  .scheme-swatch[data-color-scheme="standard"][data-theme-mode="dark"] {
```

Replace these two lines inside that block:
```css
    --accent: #b9b9b9;
    --accent-strong: #e1e1e1;
```
With:
```css
    --accent: #62b09c;
    --accent-strong: #88ccbe;
```

- [ ] **Step 3: Run the existing theme-fonts tests to observe the failure**

```bash
npx vitest run src/styles/theme-fonts.test.ts
```

Expected: FAIL on "uses soft grayscale tokens for the dark theme surfaces" — it asserts `--accent: #b9b9b9` which no longer exists.

- [ ] **Step 4: Update the failing assertion in `theme-fonts.test.ts`**

Open `src/styles/theme-fonts.test.ts`. The failing test currently reads:

```typescript
it("uses soft grayscale tokens for the dark theme surfaces", () => {
  const tailwindCss = readFileSync(
    path.join(rootDirectory, "src", "styles", "tailwind.css"),
    "utf8",
  );

  expect(tailwindCss).toContain(':root[data-color-scheme="standard"][data-theme-mode="dark"]');
  expect(tailwindCss).toContain("--surface-base: #151515");
  expect(tailwindCss).toContain("--surface-subtle: #252525");
  expect(tailwindCss).toContain("--text-secondary: #c7c7c7");
  expect(tailwindCss).toContain("--accent: #b9b9b9");
});
```

Replace the entire `it(...)` block with:

```typescript
it("uses dark surface tokens for the standard dark theme", () => {
  const tailwindCss = readFileSync(
    path.join(rootDirectory, "src", "styles", "tailwind.css"),
    "utf8",
  );

  expect(tailwindCss).toContain(':root[data-color-scheme="standard"][data-theme-mode="dark"]');
  expect(tailwindCss).toContain("--surface-base: #151515");
  expect(tailwindCss).toContain("--surface-subtle: #252525");
  expect(tailwindCss).toContain("--text-secondary: #c7c7c7");
  expect(tailwindCss).toContain("--accent: #62b09c");
});
```

- [ ] **Step 5: Run the theme-fonts tests and confirm they pass**

```bash
npx vitest run src/styles/theme-fonts.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tailwind.css src/styles/theme-fonts.test.ts
git commit -m "feat: introduce teal-sage brand accent for standard color scheme"
```

---

## Task 2: Active tab bottom indicator

The `Tab` component distinguishes active from inactive via background and border color alone. A small accent-colored pill at the bottom of the active tab makes the active state unambiguous at a glance without redesigning the whole tab strip.

**Files:**
- Modify: `src/components/shared/tab/tab.tsx`
- Modify: `src/components/shared/tab/tab.test.tsx`

- [ ] **Step 1: Write the failing test for the active indicator**

Open `src/components/shared/tab/tab.test.tsx`. Add this test inside the `describe("Tab", ...)` block, after the last existing test:

```typescript
it("renders an accent indicator on the active tab", () => {
  const { rerender } = render(<Tab ariaSelected isActive>Notes</Tab>);

  const wrapper = screen.getByRole("tab", { name: "Notes" }).parentElement!;
  expect(wrapper).toHaveClass("relative");
  // Tailwind after: utility classes appear on the element itself in the DOM class list
  expect(wrapper.className).toContain("after:absolute");

  rerender(<Tab ariaSelected={false} isActive={false}>Notes</Tab>);
  const inactiveWrapper = screen.getByRole("tab", { name: "Notes" }).parentElement!;
  expect(inactiveWrapper.className).not.toContain("after:absolute");
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/components/shared/tab/tab.test.tsx
```

Expected: FAIL on "renders an accent indicator on the active tab" — wrapper does not have class `relative`.

- [ ] **Step 3: Update `tab.tsx` to add the active indicator**

Open `src/components/shared/tab/tab.tsx`. Replace the entire return statement's opening `<div>` className string:

Current (the outer `<div>` className):
```typescript
    <div
      data-tab-item="true"
      className={`inline-flex min-w-0 items-center gap-2 rounded-app-md border px-3.5 py-2 text-[0.82rem] shadow-[var(--shadow-crisp)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ${
        isActive
          ? "border-[color:color-mix(in_srgb,var(--glass-border)_74%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))] text-app-text"
          : "border-[color:transparent] bg-[color:color-mix(in_srgb,var(--surface-panel)_90%,var(--surface-subtle))] text-app-text-secondary shadow-none hover:border-[color:color-mix(in_srgb,var(--glass-border)_66%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_94%,var(--surface-panel-strong))] hover:text-app-text"
      } ${className ?? ""}`}
    >
```

Replace with:
```typescript
    <div
      data-tab-item="true"
      className={`relative inline-flex min-w-0 items-center gap-2 rounded-app-md border px-3.5 py-2 text-[0.82rem] shadow-[var(--shadow-crisp)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ${
        isActive
          ? "after:pointer-events-none after:absolute after:bottom-1.5 after:left-2.5 after:right-2.5 after:h-[2px] after:rounded-full after:bg-[color:var(--accent)] after:opacity-75 border-[color:color-mix(in_srgb,var(--glass-border)_74%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--glass-elevated)_88%,var(--surface-panel-strong))] text-app-text"
          : "border-[color:transparent] bg-[color:color-mix(in_srgb,var(--surface-panel)_90%,var(--surface-subtle))] text-app-text-secondary shadow-none hover:border-[color:color-mix(in_srgb,var(--glass-border)_66%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--surface-panel)_94%,var(--surface-panel-strong))] hover:text-app-text"
      } ${className ?? ""}`}
    >
```

- [ ] **Step 4: Update the first existing test assertion to include `"relative"`**

In `tab.test.tsx`, the first test asserts:
```typescript
expect(tab.parentElement).toHaveClass("rounded-app-md", "border", "shadow-[var(--shadow-crisp)]");
```

Add `"relative"` to the list:
```typescript
expect(tab.parentElement).toHaveClass("relative", "rounded-app-md", "border", "shadow-[var(--shadow-crisp)]");
```

- [ ] **Step 5: Run the tab tests and confirm they all pass**

```bash
npx vitest run src/components/shared/tab/tab.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/tab/tab.tsx src/components/shared/tab/tab.test.tsx
git commit -m "feat: add accent pill indicator to active tab"
```

---

## Task 3: Compact sidebar buttons + left-border active selection

The sidebar's four action buttons are stacked full-width at a `sm` (36px min-height) size, consuming ~168px of vertical space above the section lists. A 2-column grid halves that to ~84px while keeping full labels visible. The active selection state currently uses a 1px all-around accent-tinted border; replacing it with a 2px left-only accent border makes the selection point more directional and visually lighter.

**Files:**
- Modify: `src/components/editor-page/workspace-sidebar/workspace-sidebar.tsx`

No test changes required — the existing tests assert button presence by accessible name (which remains unchanged) and interactive behavior (which is not touched).

- [ ] **Step 1: Verify existing sidebar tests pass before starting**

```bash
npx vitest run src/components/editor-page/workspace-sidebar/workspace-sidebar.test.tsx
```

Expected: All 5 tests PASS. If any fail, stop and investigate before proceeding.

- [ ] **Step 2: Replace the action button container class from single-column to 2-column grid**

Open `src/components/editor-page/workspace-sidebar/workspace-sidebar.tsx`.

Find:
```tsx
        <div className="grid gap-2">
```

Replace with:
```tsx
        <div className="grid grid-cols-2 gap-1.5">
```

- [ ] **Step 3: Update the active state class on project buttons**

In the same file, find the active project button className (the `project.id === activeProjectId` branch):

```typescript
                    project.id === activeProjectId
                      ? "border-[color:color-mix(in_srgb,var(--accent)_42%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface-panel-strong))]"
                      : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
```

Replace with:
```typescript
                    project.id === activeProjectId
                      ? "border-transparent border-l-2 border-l-[color:var(--accent)] pl-[calc(0.625rem-2px)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-panel-strong))]"
                      : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
```

- [ ] **Step 4: Update the active state class on document (file) buttons**

In the same file, find the active document button className (the `document.id === activeDocumentId` branch):

```typescript
                      document.id === activeDocumentId
                        ? "border-[color:color-mix(in_srgb,var(--accent)_42%,var(--glass-border-strong))] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface-panel-strong))]"
                        : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
```

Replace with:
```typescript
                      document.id === activeDocumentId
                        ? "border-transparent border-l-2 border-l-[color:var(--accent)] pl-[calc(0.625rem-2px)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-panel-strong))]"
                        : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
```

- [ ] **Step 5: Run the sidebar tests to confirm no regressions**

```bash
npx vitest run src/components/editor-page/workspace-sidebar/workspace-sidebar.test.tsx
```

Expected: All 5 tests PASS. Button accessible names are unchanged; interaction behavior is unchanged.

- [ ] **Step 6: Run the full test suite to catch any cross-component regressions**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor-page/workspace-sidebar/workspace-sidebar.tsx
git commit -m "feat: compact sidebar action buttons and add accent left-border to active selection"
```

---

## Self-Review

**Spec coverage:**
- ✅ Brand accent color — Task 1 introduces `#4a7c6e` / `#62b09c` teal-sage for standard scheme
- ✅ Active tab indicator — Task 2 adds a 2px pill accent at tab bottom
- ✅ Sidebar button compactness — Task 3 changes to 2-column grid
- ✅ Selected item left-border — Task 3 replaces all-around border with `border-l-2`

**Placeholder scan:** No TBDs or "implement later" — every step shows the exact diff.

**Type consistency:** No new types introduced. All changes are className strings and CSS token values.

**Skipped from review (out of scope for this plan):**
- Toolbar grouping: already implemented via `separatorClassName` dividers
- "Install app" button: already in the appropriate utilities column of the top-bar
- Typography upgrade: Geist + IBM Plex Mono + Source Serif 4 are already loaded and applied; changing fonts would require updating `theme-fonts.test.ts` assertions for every font family — a separate plan
