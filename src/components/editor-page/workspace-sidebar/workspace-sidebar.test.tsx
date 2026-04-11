import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceSidebar } from "./workspace-sidebar";
import { useDocumentStore } from "../../../store/document";

describe("WorkspaceSidebar", () => {
  beforeEach(() => {
    useDocumentStore.setState({
      projects: [
        {
          id: "project-1",
          name: "Project 1",
          documents: [
            { id: "document-1", content: "# Welcome", filePath: null, isDirty: false },
            { id: "document-2", content: "# Notes", filePath: "D:\\notes\\notes.md", isDirty: true },
          ],
          activeDocumentId: "document-2",
        },
        {
          id: "project-2",
          name: "Research",
          documents: [{ id: "document-3", content: "# Research", filePath: "D:\\notes\\research.md", isDirty: false }],
          activeDocumentId: "document-3",
        },
      ],
      activeProjectId: "project-1",
      openDocuments: [
        { id: "document-1", content: "# Welcome", filePath: null, isDirty: false },
        { id: "document-2", content: "# Notes", filePath: "D:\\notes\\notes.md", isDirty: true },
      ],
      activeDocumentId: "document-2",
      content: "# Notes",
      filePath: "D:\\notes\\notes.md",
      isDirty: true,
      recentDocuments: [
        {
          projectId: "project-2",
          documentId: "document-3",
          filePath: "D:\\notes\\research.md",
          title: "research.md",
          lastOpenedAt: 2,
        },
        {
          projectId: "project-1",
          documentId: "document-2",
          filePath: "D:\\notes\\notes.md",
          title: "notes.md",
          lastOpenedAt: 1,
        },
      ],
    });
  });

  it("renders projects, files, and recent documents", () => {
    render(
      <WorkspaceSidebar
        onNewDocument={vi.fn()}
        onOpenFile={vi.fn()}
        canOpenFolders
        onOpenFolder={vi.fn()}
        canExportFile
        onExportFile={vi.fn()}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Workspace sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open folder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Project 1 (2 files)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Research (1 files)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "notes.md (edited)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "research.md (Research)" })).toBeInTheDocument();
  });

  it("switches projects when a project is selected", async () => {
    const user = userEvent.setup();
    render(<WorkspaceSidebar onNewDocument={vi.fn()} onOpenFile={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Research (1 files)" }));

    expect(useDocumentStore.getState().activeProjectId).toBe("project-2");
    expect(useDocumentStore.getState().content).toBe("# Research");
  });

  it("opens a recent document across projects", async () => {
    const user = userEvent.setup();
    render(<WorkspaceSidebar onNewDocument={vi.fn()} onOpenFile={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "research.md (Research)" }));

    expect(useDocumentStore.getState().activeProjectId).toBe("project-2");
    expect(useDocumentStore.getState().activeDocumentId).toBe("document-3");
  });

  it("does not show folder actions when directory access is unavailable", () => {
    render(<WorkspaceSidebar onNewDocument={vi.fn()} onOpenFile={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Open folder" })).not.toBeInTheDocument();
  });

  it("renames the open action to import files when browser import is available", () => {
    render(<WorkspaceSidebar onNewDocument={vi.fn()} onOpenFile={vi.fn()} canImportFiles />);

    expect(screen.getByRole("button", { name: "Import files" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open file" })).not.toBeInTheDocument();
  });
});
