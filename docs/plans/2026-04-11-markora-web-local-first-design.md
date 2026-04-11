# Markora Web Local-First Design

**Goal:** Define a first-class browser version of Markora that preserves the desktop editor/preview workflow while adding local-first multi-project workspace capabilities.

**Summary:** Markora Web should be a real browser app, not a landing page or thin companion. It should open directly into an editor-first experience with projects, files, recents, and live preview. The web app should use the File System Access API where available, and fall back to browser-managed local workspaces stored in IndexedDB when direct disk access is unavailable.

---

## Product Direction

Markora becomes a two-platform product:

- **Desktop:** Tauri-based native app, with Rust responsible for markdown rendering and file I/O.
- **Web:** Browser-based local-first editor, using React for the UI, browser APIs for file access and persistence, and a browser-side markdown renderer for preview.

The web version should not depend on accounts, cloud sync, or backend storage in its first version.

## User Experience

The browser app should open directly into the editing surface. The first screen should include:

- a workspace sidebar for projects, files, and recents
- an editor pane
- a live preview pane

The web experience should feel more app-like than the current desktop shell by supporting multiple projects and files from day one.

## Storage and File Strategy

Markora Web should support two workspace modes:

1. **Filesystem-backed workspaces**
   - Uses the File System Access API where supported.
   - Lets users open a real folder from disk.
   - Reads and writes real markdown files after permission is granted.

2. **Browser-backed workspaces**
   - Uses IndexedDB for project metadata and file content.
   - Works in browsers without File System Access support.
   - Supports import/export so users can move data in and out easily.

This gives the web app a strong local-first story without blocking users on browser support.

## Architecture

The frontend should introduce a small platform boundary around capabilities that differ between desktop and web:

- file access
- workspace/project management
- markdown rendering
- persistence for recents and settings

The UI should depend on shared interfaces rather than directly calling Tauri or browser APIs. A likely structure is:

- `src/platform/files/desktop.ts`
- `src/platform/files/web.ts`
- `src/platform/markdown/desktop.ts`
- `src/platform/markdown/web.ts`
- `src/platform/persistence/web.ts`

Desktop code should continue using `invoke(...)` to reach Rust commands. Web code should use browser APIs and local persistence directly through the adapter layer.

## State Model

The current Zustand document store is single-document oriented. The web app needs a workspace-aware state model with at least these concepts:

- **Workspace**
  - source type: `filesystem` or `browser`
  - recent/open metadata
  - collection of projects

- **Project**
  - logical container for files
  - may map to a user-selected folder or IndexedDB namespace

- **Document**
  - stable id or path
  - title
  - content
  - dirty state
  - preview HTML
  - timestamps

The desktop app can continue using a smaller surface initially, but the shared state model should grow in a way that can support both platforms.

## Markdown Rendering

Desktop must keep markdown parsing in Rust.

Web needs a browser-side markdown renderer because it cannot use Tauri commands. The initial goal should be acceptable preview parity rather than perfect byte-for-byte output parity with the Rust renderer. Differences should be documented and narrowed over time if they become user-visible problems.

## Rollout Strategy

### Phase 1: Shared Shell Extraction

- Separate editor/preview UI concerns from Tauri-specific behavior.
- Introduce platform adapters for file and markdown operations.

### Phase 2: Web Single-Document Path

- Get the editor and preview working in a browser with local persistence.
- Prove the browser markdown rendering path and cross-platform shell structure.

### Phase 3: Workspace and Project Model

- Add projects, file trees, recents, and browser-backed local workspaces.

### Phase 4: Real Filesystem Integration

- Add open/save folder support with the File System Access API.
- Keep browser-managed workspaces as fallback.

### Phase 5: Polish

- Improve first-run onboarding.
- Add import/export affordances.
- Tighten dirty-state, recovery, and unsupported-browser handling.

## Risks

- Browser markdown rendering may diverge from Rust output.
- File System Access API support is uneven across browsers.
- The current single-document store will need careful expansion to avoid destabilizing desktop behavior.

## Recommendation

Build Markora Web as a first-class local workspace editor while preserving the desktop app as the native power-user experience. Refactor only the boundaries needed to ship the browser app; avoid a large preemptive platform rewrite.
