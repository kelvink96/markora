import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDirectory = path.resolve(import.meta.dirname, "..", "..");

describe("theme fonts", () => {
  it("loads the typography stack from Google Fonts", () => {
    const indexHtml = readFileSync(path.join(rootDirectory, "index.html"), "utf8");

    expect(indexHtml).toContain("fonts.googleapis.com");
    expect(indexHtml).toContain("family=Geist");
    expect(indexHtml).toContain("family=IBM+Plex+Mono");
    expect(indexHtml).toContain("family=Source+Serif+4");
  });

  it("uses Geist as the primary UI font token", () => {
    const tailwindCss = readFileSync(
      path.join(rootDirectory, "src", "styles", "tailwind.css"),
      "utf8",
    );

    expect(tailwindCss).toContain('--font-ui: "Geist"');
  });

  it("defines an atmospheric background field for the acrylic surfaces", () => {
    const tailwindCss = readFileSync(
      path.join(rootDirectory, "src", "styles", "tailwind.css"),
      "utf8",
    );

    expect(tailwindCss).toContain("--bg-atmosphere-base");
    expect(tailwindCss).toContain("--bg-atmosphere-top");
    expect(tailwindCss).toContain("--bg-atmosphere-bottom");
    expect(tailwindCss).toContain("--bg-atmosphere-glow");
    expect(tailwindCss).toContain("radial-gradient(at 18% 18%");
    expect(tailwindCss).toContain("radial-gradient(at 82% 68%");
    expect(tailwindCss).toContain("radial-gradient(at 50% 50%");
    expect(tailwindCss).toContain("var(--bg-atmosphere-base)");
  });
});
