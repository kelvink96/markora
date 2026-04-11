# Markora Fluent Tab Strip Design

**Goal:** Refresh the document tab strip so it establishes a Fluent-inspired acrylic visual language that can later scale across the app.

## Direction

Markora will use an "editorial acrylic" tab strip rather than a literal Fluent clone. The tab rail should feel desktop-native and glassy, but the active writing context should remain calm and legible instead of chrome-heavy.

## Visual Rules

- The full strip becomes a translucent rail with a mica-like tint, soft blur, and a quiet separator.
- Inactive tabs stay lightly translucent and low-contrast so they read as available but not dominant.
- The active tab becomes a brighter frosted surface with a subtle inner highlight and a lifted shadow.
- Hover states should look like light moving across glass rather than a flat button fill.
- The close action stays integrated into the tab surface and only becomes prominent on hover/focus.
- The new-tab action should feel attached to the rail, not like a detached utility button.

## Scope

- Update theme tokens needed for acrylic tab surfaces.
- Restyle the tab strip component without changing its behavior or accessibility model.
- Update tests to reflect the new visual contract while preserving interaction coverage.
