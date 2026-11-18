import { create } from "zustand";
import { loadViewMode, saveViewMode } from "./view-mode-storage";

export type WorkspaceViewMode = "live" | "edit" | "split" | "preview";

interface WorkspaceState {
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
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
  showOutline: false,
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),
}));
