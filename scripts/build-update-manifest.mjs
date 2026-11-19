import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export function buildUpdateManifest({ version, notes, pubDate, url, signature }) {
  if (!signature) {
    throw new Error("buildUpdateManifest: signature is required");
  }
  if (!version || !url) {
    throw new Error("buildUpdateManifest: version and url are required");
  }
  return {
    version,
    notes,
    pub_date: pubDate,
    platforms: { "windows-x86_64": { signature, url } },
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      version: { type: "string" },
      url: { type: "string" },
      "signature-file": { type: "string" },
      notes: { type: "string", default: "" },
      out: { type: "string" },
    },
  });
  if (!values["signature-file"] || !values.out) {
    throw new Error("--signature-file and --out are required");
  }

  const manifest = buildUpdateManifest({
    version: values.version,
    notes: values.notes,
    pubDate: new Date().toISOString(),
    url: values.url,
    signature: readFileSync(values["signature-file"], "utf8").trim(),
  });
  writeFileSync(values.out, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
