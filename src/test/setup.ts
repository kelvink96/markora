// Extends Vitest's expect() with browser-oriented assertions from Testing Library.
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Keep tests isolated so DOM state from one test never leaks into the next.
afterEach(() => {
  cleanup();
});

// jsdom has no layout engine, but Radix UI (tooltips, menus, selects, dialogs) calls these
// browser APIs, so give it harmless stand-ins.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// CodeMirror measures text ranges when scrolling a selection into view; jsdom has no layout.
Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
Range.prototype.getBoundingClientRect ??= () =>
  ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, toJSON: () => ({}) }) as DOMRect;
