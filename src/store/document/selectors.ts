import type { DocumentState } from "./types";

/** True when any open document, in any project, has edits that are not saved to disk. */
export function selectHasUnsavedChanges(state: Pick<DocumentState, "projects">) {
  return state.projects.some((project) => project.documents.some((document) => document.isDirty));
}
