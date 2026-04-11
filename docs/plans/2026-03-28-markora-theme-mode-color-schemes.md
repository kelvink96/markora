# Markora Theme Mode And Color Schemes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep light and dark theme modes while introducing app-wide color schemes that adapt to the resolved mode and drive the full shell, editor, and preview.

**Architecture:** Extend the persisted settings model with a `colorScheme` field that is independent from `theme`. The resolved mode still comes from the existing theme store, while the chosen color scheme is applied at the shell level through document attributes and shared CSS tokens so every surface reads from one token system.

**Tech Stack:** React, TypeScript, Zustand, Tailwind CSS v4 token layers, Tauri v2, Rust, Vitest

---

### Task 1: Add persisted color-scheme settings defaults

**Files:**
- Modify: `D:/works/design-sparx/markora/src/features/settings/settings-schema.ts`
- Modify: `D:/works/design-sparx/markora/src/features/settings/settings-schema.test.ts`
- Modify: `D:/works/design-sparx/markora/src/features/settings/settings-store.test.ts`
- Modify: `D:/works/design-sparx/markora/src-tauri/src/commands/settings.rs`

**Step 1: Write the failing frontend settings tests**

Add assertions that default settings include `appearance.colorScheme === "standard"` and that `updateAppearance` can store `colorScheme: "sepia"`.

```ts
it("defaults to the standard color scheme", () => {
  expect(defaultSettings.appearance.colorScheme).toBe("standard");
});

it("updates appearance color scheme", () => {
  useSettingsStore.getState().updateAppearance({ colorScheme: "sepia" });
  expect(useSettingsStore.getState().settings.appearance.colorScheme).toBe("sepia");
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/settings/settings-schema.test.ts src/features/settings/settings-store.test.ts`

Expected: FAIL because `colorScheme` does not exist yet.

**Step 3: Write the failing Rust compatibility test**

Add a test that loads a legacy `settings.json` without `colorScheme` and expects the loaded settings to default to `standard`.

```rust
assert_eq!(settings.appearance.color_scheme, ColorScheme::Standard);
```

**Step 4: Run Rust test to verify it fails**

Run: `cargo test settings`

Expected: FAIL because the Rust settings model does not define `color_scheme`.

**Step 5: Implement the minimal schema and persistence changes**

Add a `ColorScheme` union/type in TypeScript and enum in Rust. Extend `AppearanceSettings` with `colorScheme`, default it to `standard`, and add serde defaults in Rust so existing files still load.

```ts
export type ColorScheme = "standard" | "sepia" | "high-contrast";

export interface AppearanceSettings {
  theme: ThemePreference;
  colorScheme: ColorScheme;
  editorFontSize: number;
  ...
}
```

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ColorScheme {
    Standard,
    Sepia,
    HighContrast,
}
```

**Step 6: Run tests to verify they pass**

Run: `npx vitest run src/features/settings/settings-schema.test.ts src/features/settings/settings-store.test.ts`

Expected: PASS

Run: `cargo test settings`

Expected: PASS

**Step 7: Commit**

```bash
git add src/features/settings/settings-schema.ts src/features/settings/settings-schema.test.ts src/features/settings/settings-store.test.ts src-tauri/src/commands/settings.rs
git commit -m "feat: persist theme color schemes"
```

### Task 2: Apply resolved mode plus color scheme at the app shell

**Files:**
- Modify: `D:/works/design-sparx/markora/src/app/app-shell/app-shell.tsx`
- Modify: `D:/works/design-sparx/markora/src/app/app-shell/app-shell.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/App.tsx`

**Step 1: Write the failing shell tests**

Extend the shell tests so they require both the resolved mode and a `data-color-scheme` attribute, and verify the shell receives the chosen scheme.

```tsx
expect(document.documentElement).toHaveAttribute("data-theme-mode", "dark");
expect(document.documentElement).toHaveAttribute("data-color-scheme", "sepia");
expect(screen.getByTestId("app-shell")).toHaveClass("color-scheme-sepia");
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`

Expected: FAIL because `AppShell` only knows about `theme`.

**Step 3: Implement the minimal shell plumbing**

Update `AppShell` props to accept both `themeMode` and `colorScheme`. Set `data-theme-mode` and `data-color-scheme` on `document.documentElement`, and add a scheme class on the shell root if useful for testing or styling hooks.

Pass `settings.appearance.colorScheme` from `App.tsx` into `AppShell`.

```tsx
<AppShell
  themeMode={theme}
  colorScheme={settings.appearance.colorScheme}
  ...
/>
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/app-shell/app-shell.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/app-shell/app-shell.tsx src/app/app-shell/app-shell.test.tsx src/App.tsx
git commit -m "feat: apply color scheme at app shell"
```

### Task 3: Standardize tokens so schemes adapt to light and dark modes

**Files:**
- Modify: `D:/works/design-sparx/markora/src/styles/tailwind.css`
- Test: `D:/works/design-sparx/markora/src/styles/theme-fonts.test.ts`

**Step 1: Write the failing token tests**

Add or extend tests that assert the default theme remains the current Markora visual system and that a second scheme changes meaningful tokens in both light and dark modes.

```ts
expect(css).toContain('[data-color-scheme="standard"][data-theme-mode="light"]');
expect(css).toContain('[data-color-scheme="sepia"][data-theme-mode="dark"]');
expect(css).toContain("--accent:");
expect(css).toContain("--shadow-ambient:");
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/styles/theme-fonts.test.ts`

Expected: FAIL because the CSS does not define combined mode/scheme selectors yet.

**Step 3: Implement the minimal token refactor**

Refactor the token layer in `tailwind.css` so:
- `standard` becomes the named default scheme
- every supported scheme defines light and dark tokens
- shell tokens (`surface`, `glass`, `text`, `accent`, `shadow`, `border`) and preview tokens resolve from the same layer

Recommended selector shape:

```css
:root[data-color-scheme="standard"][data-theme-mode="light"] { ... }
:root[data-color-scheme="standard"][data-theme-mode="dark"] { ... }
:root[data-color-scheme="sepia"][data-theme-mode="light"] { ... }
:root[data-color-scheme="sepia"][data-theme-mode="dark"] { ... }
:root[data-color-scheme="high-contrast"][data-theme-mode="light"] { ... }
:root[data-color-scheme="high-contrast"][data-theme-mode="dark"] { ... }
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/styles/theme-fonts.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/styles/tailwind.css src/styles/theme-fonts.test.ts
git commit -m "feat: standardize theme tokens by mode and scheme"
```

### Task 4: Move settings UI from reader scheme to app-wide color schemes

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx`

**Step 1: Write the failing settings-page tests**

Replace the current reader-only expectations with app-wide color scheme expectations:
- Appearance shows `Theme Mode` and `Color Scheme` cards
- the select label is `Color scheme`
- swatches still render in Appearance
- saving the scheme writes through `onSaveAppearance`, not `onSavePreview`

```tsx
await user.selectOptions(screen.getByLabelText(/Color scheme/i), "sepia");
await user.click(screen.getByRole("button", { name: "Save appearance" }));
expect(onSaveAppearance).toHaveBeenCalledWith(expect.objectContaining({ colorScheme: "sepia" }));
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`

Expected: FAIL because the UI still treats schemes as preview-specific.

**Step 3: Implement the minimal UI changes**

Update the settings page so the Appearance area owns:
- theme mode select
- color scheme select
- scheme swatches that preview the whole app character

Remove reader-scheme saving from the Preview section. Save scheme changes through `onSaveAppearance`.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings-page/settings-page.tsx src/components/settings-page/settings-page.test.tsx
git commit -m "feat: move app color schemes into appearance settings"
```

### Task 5: Align preview and editor surfaces with app-wide schemes

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/preview-pane/preview-pane.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/editor-pane/editor-pane.test.tsx`

**Step 1: Write the failing preview/editor tests**

Change the tests so preview and editor styling are driven by the app-wide scheme tokens rather than the old `readerTheme` classes.

```tsx
expect(screen.getByTestId("preview-content")).not.toHaveAttribute("data-reader-theme");
expect(screen.getByTestId("preview-content")).toHaveClass("bg-app-preview");
```

Add an editor assertion that the editor still responds to the resolved mode but now reads shared CSS variables for the scheme-sensitive colors.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/editor-page/preview-pane/preview-pane.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx`

Expected: FAIL because preview still uses dedicated reader-theme classes.

**Step 3: Implement the minimal integration**

Remove preview-specific scheme plumbing that duplicates the shell theme system. Let the preview and editor rely on the app-wide tokens exposed by the shell attributes. Keep mode-sensitive CodeMirror logic intact, but use shared variables for colors where possible.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/editor-page/preview-pane/preview-pane.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx`

Expected: PASS

**Step 5: Run final verification**

Run: `npx vitest run src/features/settings/settings-schema.test.ts src/features/settings/settings-store.test.ts src/app/app-shell/app-shell.test.tsx src/components/settings-page/settings-page.test.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx src/styles/theme-fonts.test.ts`

Expected: PASS

Run: `npx tsc --noEmit`

Expected: PASS

Run: `cargo test settings`

Expected: PASS

**Step 6: Commit**

```bash
git add src/components/editor-page/preview-pane/preview-pane.tsx src/components/editor-page/preview-pane/preview-pane.test.tsx src/components/editor-page/editor-pane/editor-pane.tsx src/components/editor-page/editor-pane/editor-pane.test.tsx
git commit -m "feat: integrate app color schemes across editor and preview"
```
