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
