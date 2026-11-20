import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// release-it bumps these three together (see .release-it.json), and the app shows the version from
// package.json while the installer and updater use the other two. If they differ, something changed one
// of them by hand or as a side effect (an `npm version` run by a tool, for example), and the app would
// ship saying one version and installing another.
const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const packageVersion = (JSON.parse(read("package.json")) as { version: string }).version;
const tauriVersion = (JSON.parse(read("src-tauri/tauri.conf.json")) as { version: string }).version;
// The first `version =` in Cargo.toml is the [package] one.
const cargoVersion = /^version\s*=\s*"([^"]+)"/m.exec(read("src-tauri/Cargo.toml"))?.[1];

describe("app version", () => {
  it("is the same in package.json, tauri.conf.json and Cargo.toml", () => {
    expect({ packageVersion, tauriVersion, cargoVersion }).toEqual({
      packageVersion: tauriVersion,
      tauriVersion,
      cargoVersion: tauriVersion,
    });
  });
});
