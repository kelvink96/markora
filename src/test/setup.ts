// Extends Vitest's expect() with browser-oriented assertions from Testing Library.
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Keep tests isolated so DOM state from one test never leaks into the next.
afterEach(() => {
  cleanup();
});
