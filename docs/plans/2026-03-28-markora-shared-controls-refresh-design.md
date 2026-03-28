# Markora Shared Controls Refresh Design

## Overview

This document defines the visual direction for the next phase of Markora's shared UI library refresh. The immediate implementation target is `Select` and `Checkbox`, but the scope is intentionally broader: these two controls will establish the design rules that future shared primitives should follow.

Markora's current control styling is serviceable, but some primitives still read as default browser elements with light theme token application. That gap is most visible in `Select` and `Checkbox`. They work, but they do not yet feel as deliberate, modern, or app-specific as the rest of the editor shell.

The goal of this design is to establish a shared control language that feels modern and desktop-native, integrates cleanly with the current theme and color schemes, and can scale across the rest of the shared component set without requiring a new visual system.

## Goal

Markora should adopt a modern shared control language that:

- upgrades `Select` and `Checkbox` first as the initial proving ground
- integrates with the current theme and color scheme tokens
- reduces dependence on half-finished glass styling as the primary control identity
- makes controls feel more intentional, polished, and desktop-first
- creates reusable rules that can later extend to `Button`, `Switch`, `Tab`, `SegmentedControl`, `Menu`, `Dialog`, and other shared primitives

## Chosen Direction

The selected direction is **refined desktop utility**.

This direction keeps the controls calm and productive, but gives them more precision and structure than they have today. Instead of using blur and translucency as the main visual idea, controls should feel slightly more solid, slightly more deliberate, and much more stateful.

This is the right fit because:

- it integrates with existing theme tokens without introducing a second visual system
- it works across standard, sepia, and high-contrast schemes
- it suits a desktop writing tool better than a softer or more ornamental material language
- it can scale naturally across the rest of the shared UI library

## Visual System Rules

### Control Identity

Controls should feel more structured than the panels they sit inside.

Expected characteristics:

- solid or near-solid control surfaces
- sharper silhouettes than the surrounding panel glass
- restrained depth using border contrast and small shadows
- clear affordance areas for interaction cues like arrows and checks
- intentional spacing and sizing tuned for desktop usage

### Theme Integration

The current glass tokens can still contribute to the system, but primarily as color and contrast inputs rather than as literal glass effects.

Expected use:

- reuse existing surface, border, text, accent, and shadow tokens
- reduce reliance on backdrop blur for form controls
- keep control surfaces readable and stable in all color schemes
- preserve high-contrast clarity without special-case redesigns

This means the controls can sit naturally inside the current shell while still feeling more modern.

### State Language

State changes should carry more of the visual meaning than material effects.

Required states:

- default
- hover
- focus-visible
- active or pressed where relevant
- checked or selected where relevant
- disabled

Expected behavior:

- hover slightly increases border and surface contrast
- focus-visible uses a crisp, consistent ring treatment
- selected and checked states use accent tokens intentionally, not decoratively
- disabled lowers contrast while preserving legibility

## First-Pass Components

### `Select`

`Select` should remain a native select element for behavior reliability, but it should no longer look browser-default.

Expected changes:

- slightly taller control rhythm
- stronger border definition
- more deliberate right-side padding and affordance space
- custom chevron icon
- clearer hover and focus states
- calmer but more legible disabled state

The result should feel like a designed productivity control rather than a standard browser form field.

### `Checkbox`

`Checkbox` should move away from native `accent-color` styling and become a fully themed control.

Expected changes:

- custom control box styling
- stronger default border and surface treatment
- accent-backed checked state
- crisp check glyph
- subtle motion for check transitions
- compact layout that still feels tactile and intentional

The checkbox should remain efficient and quiet, but clearly part of the Markora visual system.

## Reusable Rules For Future Shared Primitives

The first pass should define system rules that later components can reuse.

Shared rules to establish:

- common control height rhythm
- consistent border weight and corner radius behavior
- unified focus ring logic
- consistent transition timing and easing
- shared disabled-state language
- accent reserved for active or selected states
- solid control surfaces with restrained depth

These rules should later inform updates to:

- `Button`
- `Switch`
- `Tab`
- `SegmentedControl`
- `Menu`
- `Dialog`
- other field and action primitives

## Architecture And Rollout

This pass should stay localized to the shared component layer and theme styling.

Primary implementation areas:

- shared control theme tokens or reusable CSS patterns in `src/styles/tailwind.css`
- `src/components/shared/select/select.tsx`
- `src/components/shared/checkbox/checkbox.tsx`

Rollout plan:

1. Introduce a small shared control styling foundation that fits the existing theme variables.
2. Refresh `Select` and `Checkbox` using that foundation.
3. Verify behavior and readability across current color schemes.
4. Reuse the same rules in future shared primitive refreshes.

This keeps the redesign app-wide in intent, but incremental in implementation.

## Testing Strategy

The visual refresh should not break current behavior or accessibility.

The implementation should verify:

- labels remain correctly associated
- `Select` still renders options and preserves native form behavior
- `Checkbox` still reflects checked and disabled state correctly
- helper and message text continue to render through `Field`
- custom presentation does not remove accessible semantics

For this phase, tests should stay focused on behavior and structure rather than brittle styling assertions.

## Non-Goals For This Pass

This pass should not:

- redesign every shared primitive immediately
- introduce a new theme system
- replace native `Select` behavior with a custom menu
- add decorative glass effects back into controls just for visual novelty
- change app workflows or page composition

The goal is to define a scalable control language, prove it with two primitives, and carry it forward across the shared library in later passes.
