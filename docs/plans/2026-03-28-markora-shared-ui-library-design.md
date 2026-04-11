# Markora Shared UI Library Design

## Overview

This document defines the first intentional shared UI library for Markora.

Markora already has a recognizable shell language: glassy panels, restrained borders, compact controls, and a desktop-first writing workflow. What it does not yet have is a consistent component layer that owns those decisions centrally. The current UI is starting to repeat button styles, field structure, segmented controls, status labels, and typography treatment across settings and editor surfaces.

The goal of this design is to establish a small but durable shared component library that improves scalability, reduces style duplication, and keeps future screens aligned without turning the app into a generic design-system exercise.

## Goal

Markora should introduce a shared UI layer that:

- centralizes repeated visual and interaction patterns
- keeps component names singular and predictable
- separates foundational primitives from compound components
- introduces a variant-based typography system through `Title` and `Text`
- preserves semantic HTML and accessibility by default
- supports the app's existing light, dark, and color-scheme foundations
- gives feature screens a cleaner composition model with less repeated Tailwind class churn

## Chosen Direction

The selected direction is a **balanced shared UI system** with two levels:

1. `foundation` components for visual primitives and common interaction states
2. `compound` components for repeated app-specific compositions built from those primitives

This is the right fit for Markora because the app is no longer a single-screen prototype, but it also does not need a large enterprise-style design system. A balanced layer gives us strong reuse in the current shell while keeping abstractions tight, app-aware, and easy to evolve.

## Naming Rules

All shared components should use singular names.

Examples:

- `Button`
- `IconButton`
- `Select`
- `Checkbox`
- `Switch`
- `Tab`
- `SegmentedControl`
- `Field`
- `Menu`
- `Dialog`
- `StatusBadge`
- `Title`
- `Text`

This avoids ambiguity and keeps import names aligned with the mental model of “one reusable unit per file.”

## Library Structure

The shared UI layer should live under `src/components/shared/` and be organized by reusable responsibility.

### Foundation Components

These components own visual styling, sizing, variants, focus states, and disabled behavior.

- `Button`
- `IconButton`
- `Select`
- `Checkbox`
- `Switch`
- `Tab`
- `SegmentedControl`
- `Title`
- `Text`
- `Card`
- `Panel`

### Compound Components

These components compose foundations into higher-level patterns already visible in Markora.

- `Field`
- `Menu`
- `Dialog`
- `StatusBadge`
- `Toolbar`

### Existing Components To Align

These already exist and should be refit onto the new foundations rather than replaced casually.

- `MenuBar`
- `ToolbarGroup`
- `ThemeToggle`
- `LivePreviewIndicator`

## Component Responsibilities

### Typography

`Title` and `Text` become the core typography primitives.

They should be variant-based rather than acting as thin wrappers around a single HTML tag.

#### `Title`

Expected responsibilities:

- render page, section, and panel headings consistently
- support semantic override with `as`
- support size variants such as `sm`, `md`, `lg`, `xl`
- support tone variants such as `default`, `muted`, `accent`
- support truncation for constrained shell surfaces

Typical uses:

- settings page title
- section headers
- document titles
- pane headings

#### `Text`

Expected responsibilities:

- render body copy, helper text, metadata, and compact descriptive text
- support semantic override with `as`
- support size variants such as `xs`, `sm`, `md`
- support tone variants such as `default`, `muted`, `subtle`, `danger`
- support weight variants where needed
- support truncation and wrap handling for dense shell layouts

Typical uses:

- settings descriptions
- helper labels
- footer metadata
- document save state descriptions

Typography components should preserve semantic HTML through `as`, but visual consistency should come from controlled variants.

### Action Controls

`Button` should become the base action primitive across the app.

Variants should likely include:

- `primary`
- `secondary`
- `ghost`
- `danger`

Sizes should likely include:

- `sm`
- `md`
- `icon`

`IconButton` should remain distinct, but it should be implemented as a specialization of the same action system so icon-only actions do not drift into a separate visual language.

### Selection Controls

`Select`, `Checkbox`, and `Switch` should be separate components. They solve different interaction problems and should not be merged through ambiguous props.

- `Select` for choosing one option from a list
- `Checkbox` for explicit boolean flags or multi-select lists
- `Switch` for immediate on/off preference toggles

This distinction is especially important in settings, where control semantics affect clarity and accessibility.

### Navigation Controls

`Tab` and `SegmentedControl` should also remain separate.

- `Tab` is for content navigation and tabbed interfaces
- `SegmentedControl` is for compact mode switching such as edit/split/preview

Although they may share base styling tokens, they should not be the same component with renamed props.

### Surfaces

`Panel` and `Card` should represent two different containment levels.

- `Panel` for larger shell surfaces such as editor, preview, and settings sidebars
- `Card` for contained content regions inside those larger shells

This preserves the current layered app feel without forcing every bordered surface into the same abstraction.

### Compound Patterns

#### `Field`

`Field` should handle repeated control scaffolding:

- label
- helper text
- control slot
- message or validation slot

This is the clearest repeated pattern in the current settings screen and should be one of the first compound abstractions.

#### `Menu`

`Menu` should wrap the shared dropdown structure for trigger, content, and item styling. The current menu bar already proves this pattern exists, but the styling should be reusable outside the menu bar itself.

#### `Dialog`

`Dialog` should own shared overlay, surface, focus, and action-row behavior for future confirmations and settings-adjacent flows. This becomes especially useful if destructive actions move beyond `window.confirm`.

#### `StatusBadge`

`StatusBadge` should unify compact state treatment such as:

- saved vs unsaved
- current document language or mode
- possibly future sync, draft, or warning states

#### `Toolbar`

`Toolbar` should provide the shared shell and spacing contract for grouped editor actions. It should work with `IconButton` and grouping primitives without embedding editor-specific commands directly.

## Accessibility and Interaction Rules

All components should follow the Vercel React best-practices and latest Vercel web interface guidelines.

The shared system should enforce these expectations by default:

- icon-only buttons require `aria-label`
- controls must use proper labels or accessible names
- interactive elements must retain visible `focus-visible` styling
- semantic elements should be preferred before ARIA workarounds
- headings should remain hierarchical when using `Title`
- text containers should support truncation or wrapping safely in tight layouts
- interactive state transitions should list explicit properties, not use `transition: all`
- reduced-motion support should remain possible as motion increases later

## State and Styling Ownership

Feature components should stop owning repeated Tailwind strings for shared UI concerns.

Instead:

- shared components own core variant maps and interaction classes
- feature components compose components and pass intent
- feature-specific layout classes remain local when they genuinely express page structure rather than component styling

This boundary reduces repetition while keeping the UI layer understandable.

## Initial Migration Targets

The first migration targets should be the places with the most repeated UI patterns today.

### Settings

`src/components/settings-page/settings-page.tsx` is the strongest early target because it currently contains:

- repeated button styling
- repeated labels and helper copy patterns
- repeated toggle rows
- repeated section heading and description structure
- local one-off primitives that are already acting like shared components

### Top Bar

`src/components/editor-page/top-bar/top-bar.tsx` should migrate to shared actions and typography where appropriate.

### View Mode Switching

`src/components/editor-page/view-mode-switcher/view-mode-switcher.tsx` should migrate to `SegmentedControl`.

### Formatting Toolbar

`src/components/editor-page/formatting-toolbar/formatting-toolbar.tsx` should migrate to the shared `Toolbar` plus refined `IconButton`.

### Status Treatment

`src/components/editor-page/document-status/document-status.tsx` and `src/components/editor-page/footer-status-bar/footer-status-bar.tsx` should migrate onto `Title`, `Text`, and `StatusBadge` where it improves consistency.

## Rollout Plan

The rollout should happen in small slices rather than a single refactor.

### Phase 1: Typography and Actions

Build and adopt:

- `Title`
- `Text`
- `Button`
- refined `IconButton`

### Phase 2: Form Foundations

Build and adopt:

- `Select`
- `Checkbox`
- `Switch`
- `Field`

### Phase 3: Navigation and Status

Build and adopt:

- `Tab`
- `SegmentedControl`
- `StatusBadge`

### Phase 4: Surface and Overlay Layer

Build and adopt:

- `Card`
- `Panel`
- `Menu`
- `Dialog`
- `Toolbar`

## Testing Strategy

The shared UI system should be introduced with component-level tests that verify:

- semantic rendering with `as`
- variant application and default behavior
- disabled states
- accessible names and labels
- interaction behavior such as toggle and selection callbacks
- keyboard-friendly focus treatment where applicable

Migration work should also verify that existing feature tests continue to pass after components are swapped in.

## What This Pass Does Not Include

This shared UI pass does not need to introduce:

- a token build pipeline
- a third-party component registry migration
- theming logic outside the current app shell model
- generic layout primitives for every possible page pattern
- speculative abstractions for screens Markora does not have yet

The goal is a practical shared app library, not a separate product-level design system.

## Follow-On Work

After the first shared UI rollout, likely next expansions are:

- form messages and validation treatment
- richer dialog flows replacing browser confirms
- menu shortcuts and richer command metadata
- responsive behavior rules if the shell becomes more adaptive
- tighter typography tokens for preview-adjacent informational UI
