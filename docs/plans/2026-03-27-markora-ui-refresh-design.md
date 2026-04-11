# Markora UI Refresh Design

## Overview

This document defines the next UI direction for Markora after the MVP editor implementation.

The goal is to evolve Markora from a functional split-pane markdown editor into a premium, productivity-first writing experience while preserving the current scope:

- focused writing canvas
- desktop-first polish
- browser-compatible visual language
- no full workspace shell yet

This design deliberately avoids turning the editor into a broad application workspace with persistent navigation rails, multiple major sections, or dashboard-like chrome. The editor remains the product.

## Design North Star

Markora should feel like a premium editorial tool, not a generic markdown utility and not an admin-style web app.

The visual direction combines:

- the previously agreed premium, productivity-first visual system
- the Stitch inspiration work from `markora v1/stitch/makora_studio/DESIGN.md`
- the practical constraint that the main writing screen remains focused and low-friction

The desired feeling is:

- calm
- precise
- premium
- typographically confident
- quietly modern

## Scope Boundaries

### In Scope

- redesign the main editor screen
- improve top bar structure and visual hierarchy
- make editor and preview surfaces feel intentional and premium
- introduce Radix Primitives for interaction patterns
- refine typography, spacing, and tonal layering
- improve document metadata and action affordances
- prepare a reusable visual system for future dialogs and secondary screens

### Out of Scope

- persistent left navigation rail on the main writing screen
- multi-page workspace shell
- settings dashboard as part of the main editor route
- product-wide navigation like `File / Edit / View / Terminal / Help`
- library, team, or profile-first product architecture

These may come later, but they are explicitly excluded from this pass.

## Visual Principles

### 1. Focused Writing Canvas

The writing screen must still feel like a place to write first.

This means:

- no persistent left rail on the main editor view
- minimal distraction from secondary controls
- a calm, structured top bar instead of a broad application header
- generous internal canvas spacing

The product should feel refined, not crowded.

### 2. Tonal Depth Over Hard Lines

The UI should avoid heavy 1px border-based separation wherever possible.

Boundaries should mostly come from:

- background shifts
- tonal surface changes
- spacing
- subtle elevation
- restrained separators only where interaction grouping truly benefits from them

This follows the Stitch design language and improves both desktop and browser presentation.

### 3. Editorial Hierarchy

Typography should do more of the interface work.

Use typography to distinguish:

- app chrome
- document identity
- preview reading content
- metadata and utility labels

The interface should feel authored, not assembled from default controls.

### 4. Premium Restraint

The UI should not become decorative for its own sake.

We want:

- low-noise surfaces
- strong hierarchy
- deliberate spacing
- controlled accent usage
- refined controls

We do not want:

- loud gradients everywhere
- chunky enterprise components
- high-contrast shadows on every element
- exaggerated motion

## Visual System

### Color Direction

The base palette should stay in sophisticated cool neutrals.

Light mode:

- soft off-white app background
- brighter writing canvas
- pale tonal surfaces for grouped controls
- deep ink-colored text
- one controlled accent for active states and key actions

Dark mode:

- soft dark rather than pure black
- layered charcoal and slate surfaces
- warm or neutralized text contrast
- restrained accent glow only where useful

Accent usage should be sparse and meaningful.

### Surface Hierarchy

Recommended surface stack:

- base app background: quiet neutral desk surface
- top bar and grouped controls: slightly lifted utility surfaces
- editor canvas: brightest writing sheet in light mode
- preview canvas: matching but slightly differentiated reading sheet
- overlays and menus: higher-elevation floating surfaces with soft blur where appropriate

Editor and preview should feel like related siblings, not identical halves.

### Typography

Recommended pairing:

- app chrome and utility text: Inter or similar high-legibility sans
- document display and major preview headings: Manrope or similar confident editorial sans

Typographic roles:

- document title and major preview headings should feel published
- metadata should be smaller and quieter
- toolbar labels should be compact and precise
- editor text remains optimized for long-form writing comfort

### Corners, Spacing, and Elevation

- radii should be moderately soft, not pill-heavy everywhere
- spacing should create breathing room between functional clusters
- shadows should be ambient and subtle
- panels should feel layered through surface contrast before shadow

## Main Screen Architecture

The main editor screen should be composed of four visual layers.

### 1. App Background

This is the quiet outer surface that frames the whole experience.

It should:

- fill the window with tonal calm
- support both desktop and browser use
- make the inner writing workspace feel placed, not flat

### 2. Premium Top Bar

This replaces the current plain toolbar.

It should contain:

- document identity
- save/open actions
- optional formatting controls
- live preview status
- word count
- theme control
- overflow/export entry point

The bar should feel like a premium control strip, not a row of default buttons.

### 3. Split Workspace

The main content area remains split:

- left: editor
- right: preview

The divider remains draggable, but visually quieter.

The split should feel balanced and architectural, not mechanical.

### 4. Floating Interaction Layer

Menus, tooltips, switches, and future dialogs should all share a coherent overlay treatment.

This is where Radix becomes valuable.

## Component Architecture

### App Shell

Responsibilities:

- overall page structure
- background surface
- top bar placement
- workspace placement

This remains intentionally light and writing-first.

### Top Bar

Recommended structure:

- left cluster:
  - brand mark or compact app identity if needed
  - active document title
  - dirty indicator

- center cluster:
  - optional formatting actions
  - grouped editor actions

- right cluster:
  - word count
  - live preview status
  - theme control
  - file/export overflow

This bar should support future growth without becoming crowded immediately.

### Editor Surface

The CodeMirror editor remains the editing engine.

This redesign should focus on:

- improved framing
- better padding
- calmer syntax presentation
- stronger writing-surface feel
- more deliberate relationship with the preview pane

### Preview Surface

The preview should feel closer to a published reading environment.

This includes:

- stronger heading rhythm
- improved text measure
- more refined spacing
- better blockquote styling
- more premium code block treatment
- better image framing

### Future Overlay Components

These are not all required in the first implementation pass, but the system should anticipate them:

- export dialog
- settings dialog
- action dropdown
- theme menu
- command/search surface

## Radix Primitive Usage

Radix should be used for behavior and accessibility, not for visual identity.

Initial recommended primitives:

- `DropdownMenu`
- `Tooltip`
- `Separator`
- `Switch`

Potential future additions:

- `Dialog`
- `Popover`
- `Tabs`
- `ScrollArea`
- `Menubar` only if desktop-style app menus become necessary later

## Interaction Model

### Writing First

The primary mode is typing.

Controls should be easy to access but visually secondary to the document.

### File Actions

Open, save, and save as remain first-class actions, but should be grouped more elegantly than plain utility buttons.

Likely approach:

- keep one visible primary save action
- move some secondary file actions into a dropdown or grouped control cluster

### Metadata

The document name, unsaved state, and useful status information should be easier to read than in the MVP.

Recommended metadata:

- file name
- dirty state
- word count
- live preview state

### Theme Interaction

Replace the emoji button with a more deliberate Radix-based theme control.

Even if only light/dark exist now, the interaction should suggest future extensibility.

### Preview Status

The preview should feel live, but the UI should not call attention to every update.

Status communication should remain quiet and confidence-building.

## What To Borrow From Stitch

Use:

- tonal depth
- calm spacing
- editorial hierarchy
- premium surface layering
- refined top control zones
- elevated overlay model for export/theme/settings later

Do not directly copy yet:

- left navigation rail in the main writing screen
- multi-section workspace navigation
- settings dashboard on the main route
- broad application nav across the top

## Implementation Strategy

Phase 1:

- introduce design tokens
- install initial Radix primitives
- redesign top bar

Phase 2:

- restyle split workspace surfaces
- improve editor and preview framing
- refine divider behavior and appearance

Phase 3:

- upgrade preview typography and prose styles
- improve metadata, status, and action grouping

Phase 4:

- introduce premium overlay pattern for export/theme interactions

## Component And File Conventions

These conventions are required for the redesign implementation so the codebase remains scalable as the product grows.

### Naming

- file names must use `kebab-case`
- avoid `PascalCase` file names
- exported React component identifiers may still use `PascalCase`, but file and folder names should remain `kebab-case`

### Component Structure

Components should be organized like this:

```text
components/
  shared/
  [page-name]/
    [component-name]/
      component-name.tsx
      component-name.test.tsx
      component-name.css
      index.ts
```

Rules:

- shared, reusable UI belongs in `components/shared`
- page-specific UI belongs under `components/[page-name]/...`
- every component gets its own folder
- each component folder should expose a barrel export through `index.ts`

### Single Responsibility

Each component should perform a single action or serve a single UI responsibility.

Examples:

- `top-bar` handles top-bar rendering and layout
- `document-status` handles file name, dirty state, and metadata display
- `theme-toggle` handles theme switching UI
- `file-menu` handles file action presentation

Avoid creating components that simultaneously own:

- layout orchestration
- file side effects
- view state
- unrelated rendering concerns

### Scalability Guidance

To keep the app scalable:

- keep state ownership explicit
- keep presentational components thin
- isolate side effects near the app shell or feature-level containers
- favor composition over oversized multi-purpose components
- keep styling colocated with the component unless it is truly global
- prefer shared tokens and shared primitives over ad hoc one-off values

### Suggested Direction For This Codebase

Recommended top-level structure for the redesign:

```text
src/
  components/
    shared/
    editor-page/
  features/
    document/
    theme/
    export/
  store/
  styles/
```

This allows us to separate:

- reusable UI primitives
- page-specific compositions
- feature logic
- global state and tokens

## Success Criteria

The redesign is successful if:

- the app still feels primarily like a writing tool
- the interface feels more premium without adding clutter
- the main screen works equally well as a desktop app and browser product
- Radix improves interaction quality without imposing a canned visual style
- the editor and preview feel like intentional surfaces rather than default containers

## Final Recommendation

Implement a premium, editorial, focused-canvas redesign using Radix Primitives for interaction behavior and a custom visual system for appearance.

Do not turn Markora into a broader workspace shell in this phase.

The writing screen should remain the center of gravity.
