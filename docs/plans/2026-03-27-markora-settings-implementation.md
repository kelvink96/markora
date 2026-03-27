# Markora Settings Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a persistent desktop-style settings experience for Markora with `system` theme support, authoring defaults, reset behavior, and an About section.

**Architecture:** Add a dedicated settings domain with a typed Zustand store on the frontend and a small Tauri command surface for settings persistence. Keep document state separate, hydrate settings at startup, and wire editor, preview, shell, and new-document creation to the resolved settings values.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Tauri v2, Rust, serde

---

### Task 1: Define the shared settings model and defaults

**Files:**
- Create: `D:/works/design-sparx/markora/src/features/settings/settings-schema.ts`
- Create: `D:/works/design-sparx/markora/src/features/settings/settings-schema.test.ts`
- Modify: `D:/works/design-sparx/markora/src/store/document.ts`

**Step 1: Write the failing test**

Add tests in `D:/works/design-sparx/markora/src/features/settings/settings-schema.test.ts` that assert:

- default settings include `appearance.theme === "system"`
- default settings include a non-empty `authoring.newDocumentTemplate`
- reset helper returns a fresh copy of defaults

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/settings/settings-schema.test.ts`
Expected: FAIL because the schema module does not exist yet.

**Step 3: Write minimal implementation**

Create `D:/works/design-sparx/markora/src/features/settings/settings-schema.ts` with:

- `ThemePreference` type
- typed interfaces for settings categories
- exported default settings object
- helper to clone defaults safely

Update `D:/works/design-sparx/markora/src/store/document.ts` so the hardcoded starter content moves behind an exported helper that can later accept settings-driven template content cleanly.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/settings/settings-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/settings-schema.ts src/features/settings/settings-schema.test.ts src/store/document.ts
git commit -m "feat: add settings schema defaults"
```

### Task 2: Add Rust settings persistence commands

**Files:**
- Create: `D:/works/design-sparx/markora/src-tauri/src/commands/settings.rs`
- Modify: `D:/works/design-sparx/markora/src-tauri/src/commands/mod.rs`
- Modify: `D:/works/design-sparx/markora/src-tauri/src/lib.rs`

**Step 1: Write the failing test**

Add Rust tests in `D:/works/design-sparx/markora/src-tauri/src/commands/settings.rs` that assert:

- loading with no file returns defaults
- saving then loading returns the persisted values
- reset deletes or ignores persisted overrides and returns defaults

Use a temp directory in tests rather than the real config directory.

**Step 2: Run test to verify it fails**

Run: `cargo test settings --manifest-path src-tauri/Cargo.toml`
Expected: FAIL because the settings command module does not exist yet.

**Step 3: Write minimal implementation**

Create `D:/works/design-sparx/markora/src-tauri/src/commands/settings.rs` with:

- serializable Rust settings structs matching the frontend schema closely
- helper functions to resolve the config file path
- `load_settings`, `save_settings`, and `reset_settings` commands
- filesystem logic using app config storage and `Result<T, String>`

Register the module in `D:/works/design-sparx/markora/src-tauri/src/commands/mod.rs` and command handlers in `D:/works/design-sparx/markora/src-tauri/src/lib.rs`.

**Step 4: Run test to verify it passes**

Run: `cargo test settings --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 5: Commit**

```bash
git add src-tauri/src/commands/settings.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add settings persistence commands"
```

### Task 3: Build the frontend settings store and Tauri client

**Files:**
- Create: `D:/works/design-sparx/markora/src/features/settings/settings-store.ts`
- Create: `D:/works/design-sparx/markora/src/features/settings/settings-store.test.ts`
- Create: `D:/works/design-sparx/markora/src/features/settings/settings-api.ts`

**Step 1: Write the failing test**

Add tests in `D:/works/design-sparx/markora/src/features/settings/settings-store.test.ts` that assert:

- the store hydrates from loaded settings
- updating a nested setting changes state correctly
- reset returns the store to defaults
- template draft state can differ from saved template state if the UI needs explicit save

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/settings/settings-store.test.ts`
Expected: FAIL because the store and API modules do not exist yet.

**Step 3: Write minimal implementation**

Create `D:/works/design-sparx/markora/src/features/settings/settings-api.ts` with small wrappers over `invoke(...)` for load, save, and reset.

Create `D:/works/design-sparx/markora/src/features/settings/settings-store.ts` with:

- persisted settings state
- hydration action
- update actions for categories and fields
- explicit template draft/save/reset actions
- reset-all action

Do not mix these values into existing theme or workspace stores yet.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/settings/settings-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/settings/settings-store.ts src/features/settings/settings-store.test.ts src/features/settings/settings-api.ts
git commit -m "feat: add settings store"
```

### Task 4: Replace the current theme store with resolved settings-driven theme behavior

**Files:**
- Modify: `D:/works/design-sparx/markora/src/features/theme/theme-store.ts`
- Modify: `D:/works/design-sparx/markora/src/features/theme/theme-store.test.ts`
- Modify: `D:/works/design-sparx/markora/src/app/app-shell/app-shell.tsx`
- Modify: `D:/works/design-sparx/markora/src/App.tsx`

**Step 1: Write the failing test**

Extend `D:/works/design-sparx/markora/src/features/theme/theme-store.test.ts` to assert:

- `system` is accepted as a preference
- resolved theme becomes `light` or `dark`
- toggling cycles only if the chosen UX still needs a quick toggle, or replace the test with explicit setter behavior

Add a component test if needed to verify `D:/works/design-sparx/markora/src/app/app-shell/app-shell.tsx` consumes resolved theme values correctly.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/theme/theme-store.test.ts src/app/app-shell/app-shell.test.tsx`
Expected: FAIL because the old theme store only supports `light` and `dark`.

**Step 3: Write minimal implementation**

Refactor the theme store so it becomes a thin adapter over settings-driven appearance values:

- store preference as `system | light | dark`
- resolve active theme from system preference
- expose explicit setters instead of a binary toggle if the settings page becomes the primary control

Update `D:/works/design-sparx/markora/src/app/app-shell/app-shell.tsx` and `D:/works/design-sparx/markora/src/App.tsx` to consume the resolved active theme and initialize settings hydration early.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/theme/theme-store.test.ts src/app/app-shell/app-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/theme/theme-store.ts src/features/theme/theme-store.test.ts src/app/app-shell/app-shell.tsx src/App.tsx
git commit -m "feat: add system theme support"
```

### Task 5: Wire settings into document creation and file behavior

**Files:**
- Modify: `D:/works/design-sparx/markora/src/store/document.ts`
- Modify: `D:/works/design-sparx/markora/src/App.tsx`
- Create: `D:/works/design-sparx/markora/src/store/document-settings-integration.test.ts`

**Step 1: Write the failing test**

Add tests in `D:/works/design-sparx/markora/src/store/document-settings-integration.test.ts` that assert:

- new documents use the saved template from settings
- changing the template does not mutate already open documents
- confirm-before-close behavior can be sourced from settings-aware app logic

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/document-settings-integration.test.ts`
Expected: FAIL because document creation does not consult settings yet.

**Step 3: Write minimal implementation**

Update `D:/works/design-sparx/markora/src/store/document.ts` so new untitled documents are created from an injected or looked-up authoring default rather than a single hardcoded constant.

Update `D:/works/design-sparx/markora/src/App.tsx` so:

- new document creation reads the saved template
- unsaved-close confirmation honors the settings flag
- future autosave and session restore hooks have a clean home even if only partially wired in this task

Keep document state as the source of truth for active content.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/document-settings-integration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/document.ts src/App.tsx src/store/document-settings-integration.test.ts
git commit -m "feat: connect settings to document behavior"
```

### Task 6: Wire settings into editor and preview presentation

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/Editor.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/Preview.tsx`
- Create: `D:/works/design-sparx/markora/src/components/settings-presentation.test.tsx`

**Step 1: Write the failing test**

Add tests in `D:/works/design-sparx/markora/src/components/settings-presentation.test.tsx` that assert:

- editor receives font size, wrap, line numbers, and tab settings from the settings store
- preview receives content width and link-opening behavior configuration
- status bar visibility is honored at the shell level or top-level render path

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings-presentation.test.tsx`
Expected: FAIL because editor and preview are not reading from settings yet.

**Step 3: Write minimal implementation**

Update `D:/works/design-sparx/markora/src/components/Editor.tsx` to map settings to CodeMirror extensions and editor styling.

Update `D:/works/design-sparx/markora/src/components/Preview.tsx` to map preview width and link behavior without moving markdown rendering out of Rust.

If the actual components live under more specific editor-page paths, update those exact files instead and keep the plan aligned with the discovered structure before coding.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings-presentation.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Editor.tsx src/components/Preview.tsx src/components/settings-presentation.test.tsx
git commit -m "feat: apply settings to editor and preview"
```

### Task 7: Build the settings view and sidebar navigation

**Files:**
- Create: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.tsx`
- Create: `D:/works/design-sparx/markora/src/components/settings-page/settings-sidebar.tsx`
- Create: `D:/works/design-sparx/markora/src/components/settings-page/settings-sections.tsx`
- Create: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.tsx`
- Modify: `D:/works/design-sparx/markora/src/App.tsx`

**Step 1: Write the failing test**

Add tests in `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx` that assert:

- the page renders `Application` and `Authoring Defaults` sections
- sidebar navigation switches visible content
- the settings button opens the settings view
- the About section is reachable

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx`
Expected: FAIL because the settings view and button wiring do not exist yet.

**Step 3: Write minimal implementation**

Create the new settings page components with:

- sidebar navigation
- grouped cards or sections for controls
- inline descriptions for advanced or non-obvious options

Update `D:/works/design-sparx/markora/src/components/editor-page/top-bar/top-bar.tsx` so the settings button calls an `onOpenSettings` prop.

Update `D:/works/design-sparx/markora/src/App.tsx` to switch between editor workspace and settings view without using a modal.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx src/components/editor-page/top-bar/top-bar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings-page/settings-page.tsx src/components/settings-page/settings-sidebar.tsx src/components/settings-page/settings-sections.tsx src/components/settings-page/settings-page.test.tsx src/components/editor-page/top-bar/top-bar.tsx src/App.tsx
git commit -m "feat: add settings page"
```

### Task 8: Add About and reset settings flows

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-sections.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx`
- Modify: `D:/works/design-sparx/markora/src/features/settings/settings-store.ts`

**Step 1: Write the failing test**

Extend `D:/works/design-sparx/markora/src/components/settings-page/settings-page.test.tsx` to assert:

- About renders app name and version
- reset-all asks for confirmation
- confirming reset restores visible control values to defaults

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: FAIL because About content or reset flow is incomplete.

**Step 3: Write minimal implementation**

Add About presentation using app metadata available to the frontend.

Add reset-all wiring that:

- asks for confirmation
- calls the reset settings API
- updates the settings store with defaults
- refreshes dependent UI where needed

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/settings-page/settings-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/settings-page/settings-sections.tsx src/components/settings-page/settings-page.test.tsx src/features/settings/settings-store.ts
git commit -m "feat: add about and settings reset"
```

### Task 9: Run final verification and tighten any drift

**Files:**
- Modify: `D:/works/design-sparx/markora/src/components/Editor.tsx`
- Modify: `D:/works/design-sparx/markora/src/components/Preview.tsx`
- Modify: `D:/works/design-sparx/markora/src/App.tsx`
- Modify: any touched test files as needed

**Step 1: Run targeted frontend tests**

Run: `npx vitest run`
Expected: PASS

**Step 2: Run TypeScript checks**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 4: Do a manual smoke pass**

Run: `npm run tauri dev`
Expected:

- settings view opens from the top bar
- theme can be set to `system`, `light`, or `dark`
- settings persist after restart
- reset restores defaults
- About is visible
- new documents use the saved template

**Step 5: Commit**

```bash
git add src App.tsx src-tauri
git commit -m "test: verify settings workflow"
```

## Notes For The Implementer

- Keep settings state out of `D:/works/design-sparx/markora/src/store/document.ts` except for the narrow integration point that reads authoring defaults when creating a new document.
- Do not move markdown parsing or file I/O out of Rust.
- Prefer explicit `setThemePreference` over binary theme toggle behavior once settings owns theme.
- If actual editor and preview component paths differ from the AGENTS summary, update the touched file list before implementation and keep commit scope narrow.
- Preserve conventional commit formatting to satisfy commitlint.
