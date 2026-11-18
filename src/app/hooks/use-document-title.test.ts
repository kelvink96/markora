import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentTitle } from "./use-document-title";
import { useDocumentStore } from "../../store/document";

describe("useDocumentTitle", () => {
  afterEach(() => {
    useDocumentStore.setState({ openDocuments: [], activeDocumentId: "" });
  });

  it("shows only the app name when no document is open", () => {
    useDocumentStore.setState({ openDocuments: [], activeDocumentId: "" });
    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("Markora");
  });

  it("shows the active document name before the app name", () => {
    useDocumentStore.setState({
      openDocuments: [{ id: "d1", content: "", filePath: "/notes/Plan.md", isDirty: false }],
      activeDocumentId: "d1",
    });
    renderHook(() => useDocumentTitle());

    expect(document.title).toBe("Plan • Markora");
  });
});
