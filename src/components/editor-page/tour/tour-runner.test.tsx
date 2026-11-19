import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useWorkspaceState } from "../../../features/workspace/workspace-state";

const joyrideProps = vi.hoisted(() => ({ options: undefined as unknown }));
vi.mock("react-joyride", () => ({
  Joyride: (props: { options: unknown }) => {
    joyrideProps.options = props.options;
    return null;
  },
}));

import TourRunner from "./tour-runner";

describe("TourRunner layout", () => {
  beforeEach(() => useWorkspaceState.setState({ showOutline: false }));

  it("restores the panel layout when the tour goes away, however it ended", () => {
    const { unmount } = render(<TourRunner onEnd={vi.fn()} />);
    useWorkspaceState.setState({ showOutline: true }); // staged by the outline stop

    unmount();

    expect(useWorkspaceState.getState().showOutline).toBe(false);
  });
});

function addEditor() {
  const editor = document.createElement("div");
  editor.className = "cm-content";
  editor.tabIndex = 0;
  document.body.append(editor);
  return editor;
}

describe("TourRunner keyboard and focus", () => {
  it("ends the tour as a skip when Escape is pressed", async () => {
    const onEnd = vi.fn();
    render(<TourRunner onEnd={onEnd} />);

    await userEvent.keyboard("{Escape}");

    expect(onEnd).toHaveBeenCalledWith("skip");
  });

  it("leaves an Escape alone while focus is in the editor, which uses it for its own menus", () => {
    const editor = addEditor();
    editor.focus();
    const onEnd = vi.fn();
    render(<TourRunner onEnd={onEnd} />);

    fireEvent.keyDown(editor, { key: "Escape" });

    expect(onEnd).not.toHaveBeenCalled();
    editor.remove();
  });

  it("hands focus back to the editor when the tour goes away", () => {
    const editor = addEditor();
    const { unmount } = render(<TourRunner onEnd={vi.fn()} />);

    unmount();

    expect(editor).toHaveFocus();
    editor.remove();
  });

  it("leaves focus alone when the user moved it somewhere else", () => {
    const editor = addEditor();
    const other = document.createElement("button");
    document.body.append(other);
    const { unmount } = render(<TourRunner onEnd={vi.fn()} />);
    other.focus();

    unmount();

    expect(other).toHaveFocus();
    editor.remove();
    other.remove();
  });
});

describe("TourRunner options", () => {
  it("opens on the tooltip, and the close button and Escape end the tour instead of stepping on", () => {
    render(<TourRunner onEnd={vi.fn()} />);

    expect(joyrideProps.options).toMatchObject({
      skipBeacon: true,
      closeButtonAction: "skip",
      dismissKeyAction: false,
      overlayClickAction: false,
    });
  });

  it("does not animate the scroll to a stop when the user prefers reduced motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes("reduced-motion") })) as typeof window.matchMedia;
    try {
      render(<TourRunner onEnd={vi.fn()} />);
      expect(joyrideProps.options).toMatchObject({ scrollDuration: 0 });
    } finally {
      window.matchMedia = original;
    }
  });
});
