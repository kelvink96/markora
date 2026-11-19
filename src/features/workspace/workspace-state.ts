import { create } from "zustand";
import { keepEditForPreexistingData, loadViewMode, saveViewMode } from "./view-mode-storage";

export type WorkspaceViewMode = "live" | "edit" | "split" | "preview";

interface WorkspaceState {
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
  /** Called when data from an earlier version is found: a launch that only defaulted to Live goes back to Edit. */
  keepEditForPreexistingData: () => void;
  /** Whether the outline (table of contents) panel is open beside the editor. */
  showOutline: boolean;
  toggleOutline: () => void;
}

export const useWorkspaceState = create<WorkspaceState>((set) => ({
  viewMode: loadViewMode(),
  setViewMode: (viewMode) => {
    saveViewMode(viewMode);
    set({ viewMode });
  },
  keepEditForPreexistingData: () => {
    const mode = keepEditForPreexistingData();
    if (mode) set({ viewMode: mode });
  },
  showOutline: false,
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),
}));
