import { create } from "zustand";

export type WorkspaceViewMode = "edit" | "split" | "preview";

interface WorkspaceState {
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
}

export const useWorkspaceState = create<WorkspaceState>((set) => ({
  viewMode: "edit",
  setViewMode: (viewMode) => set({ viewMode }),
}));
