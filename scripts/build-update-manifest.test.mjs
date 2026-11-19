import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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

describe("build-update-manifest CLI", () => {
  const script = resolve("scripts/build-update-manifest.mjs");

  function runWithNotes(notesArg) {
    const dir = mkdtempSync(join(tmpdir(), "update-manifest-"));
    try {
      const sigFile = join(dir, "a.msi.sig");
      const out = join(dir, "latest.json");
      writeFileSync(sigFile, "SIG\n");
      const result = spawnSync(
        process.execPath,
        [
          script,
          "--version",
          "1.5.0",
          "--url",
          "https://example.com/a.msi",
          "--signature-file",
          sigFile,
          notesArg,
          "--out",
          out,
        ],
        { encoding: "utf8" },
      );
      expect(result.stderr).toBe("");
      expect(result.status).toBe(0);
      return JSON.parse(readFileSync(out, "utf8"));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("accepts an empty --notes= value", () => {
    expect(runWithNotes("--notes=").notes).toBe("");
  });

  it("preserves spaces and embedded quotes in --notes=", () => {
    expect(runWithNotes('--notes=Fixes "quoted" things').notes).toBe(
      'Fixes "quoted" things',
    );
  });

  it("accepts notes that begin with a dash", () => {
    expect(runWithNotes("--notes=-leading dash").notes).toBe("-leading dash");
  });
});
