import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./theme-store";

describe("theme-store", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
  });

  it("toggles between light and dark", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });
});
