# Markora Toolbar Redesign Design

## Overview

This document defines the next top-chrome direction for Markora.

The current toolbar feels structurally weak and visually detached from the editor. It mixes document identity, utilities, and actions into one low-information strip, while the formatting controls float separately without a clear relationship to the writing surface.

The goal of this design is to replace that with a one-row segmented command bar inspired by desktop word processors and calm markdown editors such as Typedown.

## Goal

Markora should feel like a real desktop writing tool, not a floating web card layout.

The toolbar should:

- establish a strong app frame
- improve command discovery
- keep the default layout compact
- avoid visual clutter
- create a clean foundation for future settings such as one-row vs two-row toolbar modes

## Chosen Direction

The default toolbar becomes a **single-row segmented command bar** with three zones:

1. **Document Identity**
2. **Menu Commands**
3. **Utilities**

This is the selected direction because it keeps the UI compact while still giving the application a proper editor structure.

## Toolbar Structure

### Left: Document Identity

This zone anchors the user in the current file.

Contents:

- document title
- save state

This area should feel calm and stable, not like a cluster of buttons.

### Center: Menu Commands

This zone becomes the command-discovery layer.

Top-level menus:

- `File`
- `Edit`
- `View`
- `Help`

Each menu opens its own dropdown directly beneath the label.

Initial menu ownership:

- `File`: `New`, `Open`, `Save`, `Save As`
- `Edit`: lean initial set, acceptable to include placeholders or disabled items if needed
- `View`: preview visibility, layout controls later, toolbar density later
- `Help`: shortcuts, about, docs later

This replaces the current single `File` action button with a real menu model.

### Right: Utilities

This zone carries persistent status and quick controls.

Contents:

- word count
- live preview toggle or live preview status
- theme toggle

These controls should stay visually lighter than the command menus so the center still reads as the action hub.

## What This Pass Does Not Include

This pass does **not** implement the formatting toolbar redesign.

Formatting controls should not live in the top app command bar. They should return later as a separate editor-local control, attached to the editing surface instead of the global chrome.

This pass also does not redesign the full layout, side rail, or single-canvas writing mode.

## Design Principles

### 1. Segmented, Not Crowded

The toolbar should read as three grouped zones, not one continuous strip of unrelated controls.

Spacing, tonal grouping, and alignment should create the separation rather than heavy borders.

### 2. Desktop Editor Familiarity

The center menu group should feel familiar to users of Word or Google Docs.

The goal is not to copy office software visually, but to borrow its command clarity.

### 3. Calm Over Glossy

The current light and dark themes feel synthetic because of over-soft gradients, detached surfaces, and weak hierarchy.

The new toolbar should use restrained tonal contrast, clearer grouping, and stronger structure. It should look deliberate in both light and dark themes.

### 4. Shared Command Model

The future one-row/two-row toolbar setting should be a presentation choice, not a behavioral fork.

That means the toolbar actions and menu definitions should be centralized so both layouts can render the same command model later.

## UX Expectations

After this change:

- the app frame should feel more intentional immediately
- users should understand where to find commands without hunting
- the top bar should no longer compete with the editor-local toolbar
- the UI should feel less like two floating cards in a blank window

## Component Strategy

Expected implementation surfaces:

- `src/components/editor-page/top-bar/`
- `src/components/shared/` for reusable menu-bar primitives
- `src/App.tsx` only for reusing existing handlers and passing command actions through

The implementation should preserve current file and theme behavior.

## Testing Strategy

The implementation plan should verify:

- the toolbar renders three visible zones
- menu triggers render `File`, `Edit`, `View`, and `Help`
- `File` menu items still call the existing app handlers
- utility controls remain visible and accessible
- light and dark toolbar styling stays coherent

## Follow-On Work

After this toolbar pass, the next likely work items are:

- editor-local formatting toolbar redesign
- broader editor/preview layout rethink
- optional toolbar density setting: one-row vs two-row
