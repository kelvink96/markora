# Markora Precision Dark Redesign Design

**Date:** 2026-03-27

**Status:** Approved

## Summary

Markora should evolve from a clean markdown editor into a bespoke pro desktop writing tool with a productivity-first feel. The redesign should borrow the discipline of tools like Linear without copying their UI literally. The target outcome is a darker, tighter, more intentional interface where the document remains central and the surrounding chrome feels engineered, calm, and premium.

The design direction for this pass is `Precision Dark`.

## Goals

- Make Markora feel like a serious desktop productivity app suitable for Windows Store distribution.
- Preserve the split-pane markdown workflow while improving visual hierarchy and interaction quality.
- Shift the UI away from generic rounded-card styling toward a more precise, instrument-like shell.
- Give the editor clear primacy over the preview while keeping both surfaces cohesive.
- Establish a tighter visual system for spacing, color, type, and state transitions.

## Non-Goals

- Changing the core product workflow from editor-plus-preview.
- Moving markdown parsing or file access out of Rust.
- Introducing large new product features unrelated to the UI refresh.
- Recreating Linear's information architecture, navigation model, or feature set.

## Design Direction

`Precision Dark` is a high-density, restrained, desktop-first visual language. It uses compressed contrast, quiet chrome, and selective emphasis to make the interface feel premium and fast rather than decorative.

The redesign should take inspiration from Linear's polish in these areas:

- tightly controlled spacing
- subtle tonal separation between surfaces
- compact, highly legible controls
- restrained use of accent color
- crisp, near-instant interactions

The redesign should not imitate Linear's exact layout or product metaphors.

## Shell And Layout

The shell should feel like a focused command surface organized around the document. The app should read in three levels of emphasis:

1. outer app shell
2. command chrome
3. document work surfaces

The outer shell should remain the darkest layer. The top bar should sit slightly above it through a small tonal lift and light polish. The editor and preview panes should then feel like deliberate work surfaces within the workspace instead of floating cards.

The split-pane layout remains the correct foundation. The improvement comes from making every region feel more snapped to a system:

- tighter horizontal and vertical spacing
- more disciplined alignment between controls and pane edges
- fewer competing rounded containers
- clearer contrast hierarchy between background, chrome, and content

## Top Bar

The top bar should behave like a compact command rail rather than a website-style header. It should support orientation, action, and live status without stealing attention from the document.

The bar should be organized into three zones:

- left: current document identity
- center: primary action and mode controls
- right: utility and live state

### Left Zone

The left side should emphasize the current file name and dirty state. It should feel like a title strip with supporting state, not a badge collection.

### Center Zone

The center should feel like a productized mode rail. Even if actions still map to File, Edit, and View concepts, the presentation should be closer to a refined segmented control cluster than a generic application menu.

### Right Zone

The right side should act as a quiet telemetry strip. Word count, live preview state, theme mode, and future save or sync signals should share one compact visual language.

### Top Bar Behavior Rules

- reduce perceived vertical height where possible
- make controls feel inset into the bar rather than pasted on top
- rely on tone and subtle inset treatment for active states
- keep separators mostly spatial instead of literal
- align icons and text to a tight baseline rhythm

## Pane Treatment

The editor and preview should feel like related but non-identical professional work surfaces. Their relationship should communicate role:

- editor: primary instrument
- preview: verification surface

The editor should carry slightly stronger presence through contrast, focus treatment, and perceived activation. The preview should remain clear and calm while sitting slightly further back in the hierarchy.

The pane language should shift from generic rounded cards to precision panels:

- slightly smaller radius
- very subtle edge definition
- stronger internal padding discipline
- less visible border drawing
- separation driven more by tone than by thick outlines

### Divider

The divider should feel intentional and tactile. At rest it should stay understated. On hover or keyboard focus it should become more legible through a controlled highlight and slight increase in perceived weight. It should feel instrument-like, not decorative.

### Internal Pane Chrome

If pane-level headers or controls are present, they should be extremely compact and integrated into each surface. They should read as embedded rails rather than separate sub-toolbars.

## Color System

The color system should use compressed contrast with selective emphasis. Most of the UI should live in a narrow dark range, with emphasis reserved for the handful of moments that matter:

- active controls
- focus states
- dirty or status indicators
- caret-adjacent accents
- selected states

### Palette Model

- base background: near-black with a slight cool bias
- raised surfaces: dark graphite or slate
- primary text: soft white, never pure white
- secondary text: muted gray-blue or warm gray
- borders: very low-contrast
- accent: one restrained brand tone used sparingly

The redesign should avoid making every control high-contrast. Premium productivity apps feel calm because emphasis is rationed.

## Typography

Typography should establish two related but distinct voices:

- UI typography for chrome and controls
- document typography for editor and preview content

The UI typography should be compact, neutral, and stable enough for dense productivity controls. The document typography should feel more editorial and readable, with clear markdown hierarchy and generous rhythm where appropriate.

### Typographic Rules

- app labels should come from a small, disciplined size scale
- status and metadata should step down clearly from primary labels
- current file identity should use weight before size to claim importance
- pane chrome should never compete with document text

The goal is not simply attractive type. The goal is for the app to feel authored and confident.

## Interaction And Motion

Interaction quality should be crisp, immediate, and understated. The UI should feel mechanically reliable rather than playful.

### Desired Interaction Qualities

- hover states appear and fade quickly
- active states feel locked in
- focus rings are precise and brand-aware
- resizing and toolbar interactions feel predictable and tactile

### Motion Rules

- use one short duration family for hover, press, and focus
- use one slightly slower timing for panel or state transitions
- avoid springy or theatrical animation
- avoid delayed feedback on text editing actions
- use motion only where it improves clarity

Suitable motion targets include:

- background or value shifts on hover
- segmented control state transitions
- active pane focus emphasis
- divider hover and focus response
- restrained preview-update settling if it improves comprehension

## What This Means For The Next UI Pass

The next redesign implementation should focus on these concrete outcomes:

1. tighten the shell hierarchy so chrome recedes and content leads
2. reshape the top bar into a compact command rail
3. give the editor stronger visual priority than the preview
4. refine token usage so color emphasis becomes rarer and more meaningful
5. improve hover, focus, active, and resize interactions
6. unify spacing, radius, and shadow rules across the shell

## Success Criteria

The redesign is successful if:

- Markora feels bespoke and premium in screenshots and in use
- the document remains the dominant focal point
- the chrome feels compact and purposeful rather than generic
- the app communicates a stronger productivity identity suitable for desktop users
- the updated UI still preserves the current split-pane editing workflow

## Architecture Notes

This redesign should remain within the current application architecture:

- markdown parsing stays in Rust
- file operations stay in Rust Tauri commands
- frontend state remains in the Zustand document store
- the redesign should primarily affect React components, Tailwind styles, and design tokens

## Risks And Watchouts

- over-indexing on density could make writing feel cramped
- overusing accent color would weaken the premium tone
- too much chrome polish could distract from the document
- making editor and preview visually identical would weaken hierarchy
- literal imitation of Linear would make the app feel derivative instead of bespoke

## Recommendation

Proceed with a `Precision Dark` redesign pass aimed at making Markora feel like a bespoke pro desktop writing tool. Use Linear as inspiration for discipline, density, and interaction quality, but adapt the outcome to the needs of a markdown editor where the document remains the primary surface.
