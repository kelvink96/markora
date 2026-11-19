import { create } from "zustand";
import { keepEditForPreexistingData, loadViewState, saveShowSyntax, saveViewMode } from "./view-mode-storage";

export type WorkspaceViewMode = "write" | "split" | "read";

interface WorkspaceState {
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
  /** Whether Write shows raw markdown instead of rendering it inline. Other views ignore it. */
  showSyntax: boolean;
  setShowSyntax: (on: boolean) => void;
  toggleSyntax: () => void;
  /** Called when data from an earlier version is found: a launch that only defaulted to rendered Write goes back to raw syntax. */
  keepEditForPreexistingData: () => void;
  /** Whether the outline (table of contents) panel is open beside the editor. */
  showOutline: boolean;
  toggleOutline: () => void;
}

const initial = loadViewState();

export const useWorkspaceState = create<WorkspaceState>((set, get) => ({
  viewMode: initial.viewMode,
  setViewMode: (viewMode) => {
    saveViewMode(viewMode);
    set({ viewMode });
  },
  showSyntax: initial.showSyntax,
  setShowSyntax: (showSyntax) => {
    saveShowSyntax(showSyntax);
    set({ showSyntax });
  },
  toggleSyntax: () => get().setShowSyntax(!get().showSyntax),
  keepEditForPreexistingData: () => {
    if (keepEditForPreexistingData()) set({ showSyntax: true });
  },
  showOutline: false,
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),
}));
