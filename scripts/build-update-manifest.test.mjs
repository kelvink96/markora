import { describe, expect, it } from "vitest";
import { buildUpdateManifest } from "./build-update-manifest.mjs";

describe("buildUpdateManifest", () => {
  it("builds the Tauri updater manifest for windows-x86_64", () => {
    const url =
      "https://kelvink96.github.io/markora/releases/1.5.0/Markora-MD_1.5.0.msi";

    expect(
      buildUpdateManifest({
        version: "1.5.0",
        notes: "Fixes",
        pubDate: "2026-12-01T00:00:00Z",
        url,
        signature: "SIG",
      }),
    ).toEqual({
      version: "1.5.0",
      notes: "Fixes",
      pub_date: "2026-12-01T00:00:00Z",
      platforms: { "windows-x86_64": { signature: "SIG", url } },
    });
  });

  it("throws when the signature is missing", () => {
    expect(() =>
      buildUpdateManifest({
        version: "1.5.0",
        notes: "Fixes",
        pubDate: "2026-12-01T00:00:00Z",
        url: "https://example.com/a.msi",
      }),
    ).toThrow(/signature/);
  });
});
