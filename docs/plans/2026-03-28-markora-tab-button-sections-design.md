# Markora Tab And Button Section Slots Design

## Overview

This document defines a small extension to Markora's shared action components: optional left and right content sections for `Button` and `Tab`.

The current shared component layer already gives Markora consistent action styling, but composition inside actions is still uneven. `TabStrip` is the clearest example. The tab label and close action are currently arranged outside the shared `Tab` primitive, which means the shared component does not yet own the full tab layout. Similar pressure will show up in buttons as soon as the app wants leading icons, trailing badges, shortcut hints, or inline status affordances.

The goal of this design is to add a small, reusable slot model that lets shared action components own their internal layout while keeping the API simple and predictable.

## Goal

Markora should support optional left and right sections on `Button` and `Tab` so that:

- tabs can keep close actions inside the tab item
- tabs can support future leading icons or state markers
- buttons can support future leading icons or trailing affordances
- callers stop rebuilding inline layout wrappers around shared action primitives
- the main label remains the primary semantic content

## Chosen Direction

The selected direction is to add the same optional slot props to both `Button` and `Tab`:

- `leftSection?: ReactNode`
- `rightSection?: ReactNode`

This is the right fit because it solves the concrete `TabStrip` need immediately while keeping the shared component API consistent across action primitives. It avoids a one-off `Tab` solution and stops short of introducing an unnecessary abstract slot framework.

## Component Contract

### `Button`

`Button` should continue to treat `children` as the main content.

New optional props:

- `leftSection`
- `rightSection`

Expected uses:

- leading icon
- trailing badge
- shortcut hint
- inline status affordance

### `Tab`

`Tab` should gain the same slot props.

Expected uses:

- leading document icon or marker
- trailing close action
- future pinned or dirty indicators if they evolve beyond plain text

## Layout Rules

The component should own slot layout rather than forcing callers to recreate it.

Expected internal structure:

- left slot wrapper
- main content wrapper
- right slot wrapper

Layout expectations:

- the center content keeps `min-w-0`
- truncation remains available on the center content
- missing side sections collapse cleanly with no dead spacing
- side sections align visually with the main content and inherit tone by default

This keeps the slot model simple while preserving dense desktop-shell behavior.

## Interaction Rules

### General

- `children` remains the primary accessible label/content
- side sections should not accidentally replace the main accessible name
- slot wrappers are layout helpers, not separate semantics by default

### `Button`

For `Button`, side sections are usually decorative or informative, but the API should not forbid interactive content if a caller genuinely needs it.

### `Tab`

For `Tab`, `rightSection` explicitly needs to support an interactive control such as a close button.

Important behavior:

- clicking the main tab area selects the tab
- clicking an interactive control inside `rightSection` should not trigger tab selection
- the close action remains independently focusable
- `Tab` keeps its existing role and selection semantics

This is the main reason the slots should be part of the shared `Tab` contract rather than improvised around it.

## Migration Scope

This pass should stay intentionally small.

### Required

- extend `Button`
- extend `Tab`
- migrate `TabStrip` so the close button lives inside `Tab.rightSection`

### Not Required In This Pass

- migrating every existing button to use slots
- building shortcut hint components
- adding leading icons broadly across the app

The feature should ship as a capability first, with one real migration proving it.

## Testing Strategy

The implementation should verify:

- `Button` renders left and right sections when provided
- `Tab` renders left and right sections when provided
- center content still truncates correctly
- `TabStrip` close action remains clickable
- `TabStrip` main tab click still selects the tab
- clicking the close action does not trigger tab selection

## Follow-On Work

After this slot pass, likely next uses are:

- leading icons in tab items
- richer trailing metadata in tabs
- leading icons in shared buttons
- optional shortcut or hint treatments for menu-adjacent actions
