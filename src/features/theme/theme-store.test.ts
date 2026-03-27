import { beforeEach, describe, expect, it } from "vitest";
import { useThemeStore } from "./theme-store";

describe("theme-store", () => {
  beforeEach(() => {
    useThemeStore.setState({
      themePreference: "system",
      systemTheme: "light",
      resolvedTheme: "light",
    });
  });

  it("resolves the system preference using the current system theme", () => {
    useThemeStore.getState().setThemePreference("system");

    expect(useThemeStore.getState().themePreference).toBe("system");
    expect(useThemeStore.getState().resolvedTheme).toBe("light");
  });

  it("updates the resolved theme when the system theme changes", () => {
    useThemeStore.getState().setThemePreference("system");
    useThemeStore.getState().setSystemTheme("dark");

    expect(useThemeStore.getState().resolvedTheme).toBe("dark");
  });

  it("toggles to the opposite explicit theme", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().themePreference).toBe("dark");
    expect(useThemeStore.getState().resolvedTheme).toBe("dark");

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().themePreference).toBe("light");
    expect(useThemeStore.getState().resolvedTheme).toBe("light");
  });
});
