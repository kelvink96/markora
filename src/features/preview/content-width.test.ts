import { describe, expect, it } from "vitest";
import { CONTENT_WIDTH_MEASURE } from "./content-width";

describe("CONTENT_WIDTH_MEASURE", () => {
  it("maps each content width setting to its line length", () => {
    expect(CONTENT_WIDTH_MEASURE).toEqual({ narrow: "60ch", normal: "72ch", wide: "90ch" });
  });
});
