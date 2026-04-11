# Tailwind v4 Migration Design

**Date:** 2026-03-27

## Goal

Migrate Markora's frontend presentation layer from component-scoped CSS files and shared global CSS to Tailwind CSS v4, while preserving the current desktop-first split-pane editing workflow, Radix primitive behavior, Zustand-driven theme state, and Rust-owned markdown/file logic.

## Current Context

Markora already has a clean React component structure, but its styling is split across:

- shared global files in `src/styles/`
- component-specific `.css` files co-located with TSX components
- Radix primitive styling via custom CSS selectors
- CodeMirror surface styling through generated editor classes
- rendered markdown preview styling via `.prose`

That makes the styling layer consistent enough to migrate, but not trivial to replace in one pass without regressions.

## Decision

Use a full Tailwind v4 cutover for the application UI, with a deliberately small retained CSS compatibility layer for:

- root theme custom properties
- CodeMirror DOM hooks such as `.cm-editor` and `.cm-scroller`
- preview content styling for markdown HTML, unless later replaced by a Tailwind-owned prose layer

This keeps Tailwind as the owner of the UI system without forcing awkward inline utility usage for third-party generated DOM.

## Alternatives Considered

### 1. Incremental migration with long-lived CSS/Tailwind hybrid

This would be the safest path operationally, but it conflicts with the requested goal of a full cutover and would leave Markora in a mixed styling model for longer than necessary.

### 2. Full cutover with Tailwind Typography plugin for preview

This would speed up the markdown preview migration, but it would likely flatten some of the custom editorial styling currently defined in `src/styles/prose.css`.

### 3. Tailwind-only migration with no remaining CSS selectors

This is possible in theory, but it is a poor fit for CodeMirror and brittle for rendered markdown HTML. It adds complexity without meaningful product benefit.

## Architecture

### Tailwind integration

Add Tailwind v4 through the official Vite plugin path and make a new Tailwind entry stylesheet the single frontend style entry imported by `src/main.tsx`.

### Design tokens

Move the active token definitions from `src/styles/tokens.css` into the Tailwind entry stylesheet so CSS custom properties remain the source of truth for colors, radii, fonts, and spacing. Tailwind utilities should consume these variables instead of hard-coded literals wherever practical.

### Theme handling

Keep class-based theme switching so the current Zustand theme store and app shell contract remain stable. The app already passes `theme` into `AppShell`; that mechanism should continue to apply a root class that flips token values for dark mode.

### Component migration

Replace component-specific CSS files with inline Tailwind utilities in the associated TSX files. This includes:

- `app-shell`
- top bar and shared menu primitives
- formatting toolbar
- editor and preview panes
- workspace split view
- status, counters, indicators, and button primitives

### Compatibility layer

Keep one small stylesheet for selectors that target DOM we do not fully own:

- CodeMirror generated structure
- markdown preview descendants inside the rendered HTML container

This file should live under `src/styles/` and be imported after the Tailwind base entry so the ownership boundary is explicit.

## Migration Boundaries

### In scope

- Vite/Tailwind toolchain setup
- replacement of component CSS with Tailwind utilities
- migration of theme tokens into Tailwind-owned global CSS
- cleanup of obsolete CSS imports and files
- test updates where selectors or expectations change

### Out of scope

- changes to Rust markdown parsing
- changes to Tauri command interfaces
- product behavior changes to file open/save/new
- editor command behavior inside the formatting toolbar

## Risks And Mitigations

### CodeMirror regression risk

CodeMirror relies on generated DOM and extension-provided classes. Mitigation: keep a dedicated compatibility stylesheet and verify both light and dark editor surfaces in `npm run tauri dev`.

### Preview typography drift

Rendered markdown is not React-controlled element-by-element. Mitigation: preserve a prose-specific compatibility file first, then optionally refine later if we want more Tailwind-driven prose styling.

### Theme inconsistency

Markora currently has overlapping style layers in `globals.css`, `tokens.css`, and `app.css`. Mitigation: consolidate theme variables into one Tailwind entry and remove duplicate token declarations during migration instead of porting them blindly.

### Test fragility

Several tests assert on CSS class names such as `.workspace__divider` and `.editor-pane__surface`. Mitigation: update tests toward semantic queries and only keep structural selectors where they represent stable contracts.

## Testing Strategy

Automated verification:

- `npx vitest run`
- `npx tsc --noEmit`
- `npm run build`

Manual verification:

- `npm run tauri dev`
- confirm top bar and menu interactions still render correctly
- confirm divider drag and keyboard resize still work
- confirm theme toggle updates app shell, editor pane, and preview pane
- confirm markdown preview typography remains readable in both themes

## Deliverables

- Tailwind v4 configured in Vite
- one Tailwind entry stylesheet replacing current global style imports
- TSX components styled with Tailwind utilities
- a small compatibility stylesheet for CodeMirror and rendered markdown
- deleted obsolete component CSS files
- updated tests covering the migrated structure
