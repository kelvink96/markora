import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { useScrollSync } from "./use-scroll-sync";

// jsdom has no layout, so give each scroller a fixed content and viewport height.
function stubScroller(element: HTMLElement, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  let scrollTop = 0;
  Object.defineProperty(element, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, value: clientHeight });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });
}

function Harness({ enabled, withEditor = true }: { enabled: boolean; withEditor?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollSync(ref, enabled);

  return (
    <div ref={ref} data-testid="workspace">
      {withEditor ? <div className="cm-scroller" data-testid="editor" /> : null}
      <div className="preview-pane__surface" data-testid="preview" />
      <div data-testid="other" />
    </div>
  );
}

function setup(props: { enabled: boolean; withEditor?: boolean }) {
  const utils = render(<Harness {...props} />);
  // Editor: 2000 tall in a 500 window (1500 scrollable). Preview: 3000 in 600 (2400 scrollable).
  const editor = props.withEditor === false ? null : (utils.getByTestId("editor") as HTMLElement);
  const preview = utils.getByTestId("preview") as HTMLElement;
  if (editor) stubScroller(editor, { scrollHeight: 2000, clientHeight: 500 });
  stubScroller(preview, { scrollHeight: 3000, clientHeight: 600 });
  return { ...utils, editor, preview };
}

function scrollTo(element: HTMLElement, top: number) {
  element.scrollTop = top;
  fireEvent.scroll(element);
}

describe("useScrollSync", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("moves the preview to the same proportion when the editor scrolls", () => {
    const { editor, preview } = setup({ enabled: true });

    scrollTo(editor!, 750); // halfway through 1500

    expect(preview.scrollTop).toBe(1200); // halfway through 2400
  });

  it("moves the editor to the same proportion when the preview scrolls", () => {
    const { editor, preview } = setup({ enabled: true });

    scrollTo(preview, 600); // a quarter of 2400

    expect(editor!.scrollTop).toBe(375); // a quarter of 1500
  });

  it("reaches the bottom of both together", () => {
    const { editor, preview } = setup({ enabled: true });

    scrollTo(editor!, 1500);

    expect(preview.scrollTop).toBe(2400);
  });

  it("does not bounce the other pane's echo back and fight the user", () => {
    const { editor, preview } = setup({ enabled: true });

    scrollTo(editor!, 750); // moves the preview...
    fireEvent.scroll(preview); // ...which browsers report as its own scroll event

    expect(editor!.scrollTop).toBe(750); // the editor is not moved back
    expect(preview.scrollTop).toBe(1200);
  });

  it("follows the user again once the echo window has passed", () => {
    const { editor, preview } = setup({ enabled: true });

    scrollTo(editor!, 750);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    scrollTo(preview, 2400);

    expect(editor!.scrollTop).toBe(1500);
  });

  it("does nothing when disabled", () => {
    const { editor, preview } = setup({ enabled: false });

    scrollTo(editor!, 750);
    scrollTo(preview, 600);

    expect(preview.scrollTop).toBe(600);
    expect(editor!.scrollTop).toBe(750);
  });

  it("starts and stops following when the setting changes", () => {
    const { editor, preview, rerender } = setup({ enabled: false });

    rerender(<Harness enabled />);
    scrollTo(editor!, 750);
    expect(preview.scrollTop).toBe(1200);

    rerender(<Harness enabled={false} />);
    scrollTo(editor!, 1500);
    expect(preview.scrollTop).toBe(1200);
  });

  it("ignores scrolling inside anything that isn't the editor or the preview", () => {
    const { editor, preview, getByTestId } = setup({ enabled: true });

    const other = getByTestId("other");
    stubScroller(other, { scrollHeight: 900, clientHeight: 100 });
    scrollTo(other, 400);

    expect(editor!.scrollTop).toBe(0);
    expect(preview.scrollTop).toBe(0);
  });

  it("does nothing, and doesn't throw, when the other pane isn't there", () => {
    const { preview } = setup({ enabled: true, withEditor: false });

    expect(() => scrollTo(preview, 600)).not.toThrow();
  });

  it("handles content that doesn't need to scroll", () => {
    const { editor, preview } = setup({ enabled: true });
    stubScroller(editor!, { scrollHeight: 400, clientHeight: 500 }); // fits: nothing to scroll

    scrollTo(preview, 1200);

    expect(editor!.scrollTop).toBe(0);
  });

  it("keeps following a scroller that is replaced (the editor is rebuilt on theme change)", () => {
    const { editor, preview, getByTestId } = setup({ enabled: true });
    const fresh = document.createElement("div");
    fresh.className = "cm-scroller";
    stubScroller(fresh, { scrollHeight: 2000, clientHeight: 500 });
    editor!.replaceWith(fresh);

    scrollTo(fresh, 750);

    expect(preview.scrollTop).toBe(1200);
    expect(getByTestId("workspace")).toContainElement(fresh);
  });
});
