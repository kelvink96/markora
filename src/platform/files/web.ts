import type { FileAdapter } from "./types";

function unsupported(): never {
  throw new Error("Web file adapter is not implemented yet.");
}

export const webFileAdapter: FileAdapter = {
  async pickOpenPath() {
    return unsupported();
  },
  async pickSavePath() {
    return unsupported();
  },
  async readFile() {
    return unsupported();
  },
  async writeFile() {
    return unsupported();
  },
};
