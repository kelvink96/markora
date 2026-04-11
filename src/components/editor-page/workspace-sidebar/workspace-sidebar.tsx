import { Download, FilePlus2, FolderOpen, FolderTree, History, NotebookTabs } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../shared/button";
import { Panel } from "../../shared/panel";
import { useDocumentStore } from "../../../store/document";

interface WorkspaceSidebarProps {
  onNewDocument: () => void;
  onOpenFile: () => void;
  onOpenFolder?: () => void;
  onExportFile?: () => void;
  canOpenFolders?: boolean;
  canImportFiles?: boolean;
  canExportFile?: boolean;
}

function getDocumentLabel(content: string, filePath: string | null) {
  if (filePath) {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1] || "Untitled";
  }

  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstMeaningfulLine?.replace(/^#+\s*/, "") || "Untitled";
}

export function WorkspaceSidebar({
  onNewDocument,
  onOpenFile,
  onOpenFolder,
  onExportFile,
  canOpenFolders = false,
  canImportFiles = false,
  canExportFile = false,
}: WorkspaceSidebarProps) {
  const projects = useDocumentStore((state) => state.projects);
  const activeProjectId = useDocumentStore((state) => state.activeProjectId);
  const openDocuments = useDocumentStore((state) => state.openDocuments);
  const activeDocumentId = useDocumentStore((state) => state.activeDocumentId);
  const recentDocuments = useDocumentStore((state) => state.recentDocuments);
  const createProject = useDocumentStore((state) => state.createProject);
  const selectProject = useDocumentStore((state) => state.selectProject);
  const selectDocument = useDocumentStore((state) => state.selectDocument);

  const recentEntries = useMemo(() => recentDocuments.slice(0, 5), [recentDocuments]);

  const primaryActionLabel = canImportFiles ? "Import files" : "Open file";

  const actionButtonCount = 2 + (canOpenFolders ? 1 : 0) + (canExportFile ? 1 : 0);

  return (
    <aside className="workspace-sidebar min-h-0 w-[17rem] shrink-0 pl-3 pb-3 pt-2.5" aria-label="Workspace sidebar">
      <Panel className="flex h-full flex-col overflow-hidden p-3">
        <div className={`grid gap-1.5 ${actionButtonCount % 2 === 0 ? "grid-cols-2" : ""}`}>
          <Button
            size="sm"
            variant="secondary"
            leftSection={<FilePlus2 className="size-4" />}
            onClick={onNewDocument}
          >
            New note
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftSection={<FolderOpen className="size-4" />}
            onClick={onOpenFile}
          >
            {primaryActionLabel}
          </Button>
          {canOpenFolders ? (
            <Button size="sm" variant="secondary" leftSection={<FolderTree className="size-4" />} onClick={onOpenFolder}>
              Open folder
            </Button>
          ) : null}
          {canExportFile ? (
            <Button size="sm" variant="secondary" leftSection={<Download className="size-4" />} onClick={onExportFile}>
              Export file
            </Button>
          ) : null}
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <section aria-label="Projects">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-app-text-muted">
                <FolderTree className="size-3.5" aria-hidden="true" />
                <span>Projects</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => createProject()}>
                New
              </Button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  aria-label={`${project.name} (${project.documents.length} files)`}
                  className={`flex w-full items-center justify-between rounded-[6px] border px-2.5 py-2 text-left text-sm transition-colors ${
                    project.id === activeProjectId
                      ? "border-t-transparent border-r-transparent border-b-transparent border-l-2 border-l-[color:var(--accent)] pl-[calc(0.625rem-2px)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-panel-strong))]"
                      : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
                  }`}
                  onClick={() => selectProject(project.id)}
                >
                  <span className="truncate">{project.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-app-text-muted">
                    {project.documents.length}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section aria-label="Files">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-app-text-muted">
              <NotebookTabs className="size-3.5" aria-hidden="true" />
              <span>Files</span>
            </div>
            <div className="space-y-1">
              {openDocuments.length > 0 ? (
                openDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    aria-label={`${getDocumentLabel(document.content, document.filePath)}${document.isDirty ? " (edited)" : ""}`}
                    className={`flex w-full items-center justify-between rounded-[6px] border px-2.5 py-2 text-left text-sm transition-colors ${
                      document.id === activeDocumentId
                        ? "border-t-transparent border-r-transparent border-b-transparent border-l-2 border-l-[color:var(--accent)] pl-[calc(0.625rem-2px)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-panel-strong))]"
                        : "border-transparent hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
                    }`}
                    onClick={() => selectDocument(document.id)}
                  >
                    <span className="truncate">{getDocumentLabel(document.content, document.filePath)}</span>
                    {document.isDirty ? (
                      <span className="ml-3 shrink-0 text-xs text-app-text-muted">Edited</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="rounded-[6px] px-2.5 py-2 text-sm text-app-text-secondary">
                  No files in this project yet.
                </p>
              )}
            </div>
          </section>

          <section aria-label="Recent documents">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-app-text-muted">
              <History className="size-3.5" aria-hidden="true" />
              <span>Recents</span>
            </div>
            <div className="space-y-1">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry) => (
                  <button
                    key={`${entry.projectId}:${entry.documentId}`}
                    type="button"
                    aria-label={`${entry.title} (${projects.find((project) => project.id === entry.projectId)?.name ?? "Recent project"})`}
                    className="flex w-full flex-col rounded-[6px] border border-transparent px-2.5 py-2 text-left transition-colors hover:border-[color:var(--glass-border)] hover:bg-[color:color-mix(in_srgb,var(--surface-subtle)_88%,transparent)]"
                    onClick={() => {
                      selectProject(entry.projectId);
                      selectDocument(entry.documentId);
                    }}
                  >
                    <span className="truncate text-sm text-app-text">{entry.title}</span>
                    <span className="truncate text-xs text-app-text-secondary">
                      {projects.find((project) => project.id === entry.projectId)?.name ?? "Recent project"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="rounded-[6px] px-2.5 py-2 text-sm text-app-text-secondary">
                  Recent files will appear here.
                </p>
              )}
            </div>
          </section>
        </div>
      </Panel>
    </aside>
  );
}
