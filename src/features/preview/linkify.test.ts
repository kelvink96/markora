import { describe, expect, it } from "vitest";
import { linkifyBareUrls } from "./linkify";

describe("linkifyBareUrls", () => {
  it("links a bare URL and leaves trailing punctuation outside it", () => {
    expect(linkifyBareUrls("<p>see https://github.com/a/b/pull/1.</p>")).toBe(
      '<p>see <a href="https://github.com/a/b/pull/1">https://github.com/a/b/pull/1</a>.</p>',
    );
  });

  it("leaves existing links and code alone", () => {
    const html = '<p><a href="https://x.dev/a">https://x.dev/a</a> <code>https://x.dev/b</code></p>';
    expect(linkifyBareUrls(html)).toBe(html);
  });

  it("leaves text without URLs untouched", () => {
    expect(linkifyBareUrls("<p>nothing here</p>")).toBe("<p>nothing here</p>");
  });
});
