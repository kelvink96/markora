import { create } from "zustand";

export type WorkspaceViewMode = "edit" | "split" | "preview";

interface WorkspaceState {
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
  /** Whether the outline (table of contents) panel is open beside the editor. */
  showOutline: boolean;
  toggleOutline: () => void;
}

export const useWorkspaceState = create<WorkspaceState>((set) => ({
  viewMode: "edit",
  setViewMode: (viewMode) => set({ viewMode }),
  showOutline: false,
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),
}));
