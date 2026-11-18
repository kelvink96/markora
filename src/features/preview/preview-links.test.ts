import { describe, expect, it } from "vitest";
import { classifyLink } from "./preview-links";

describe("classifyLink", () => {
  it.each([
    ["https://example.com/page?q=1#top", "https://example.com/page?q=1#top"],
    ["http://example.com", "http://example.com/"],
    ["mailto:hi@example.com", "mailto:hi@example.com"],
    ["  https://example.com  ", "https://example.com/"],
  ])("opens %s externally", (href, url) => {
    expect(classifyLink(href)).toEqual({ kind: "external", url });
  });

  it.each([
    ["javascript:alert(1)"],
    ["JAVASCRIPT:alert(1)"],
    ["file:///C:/Windows/system32"],
    ["data:text/html,<script>1</script>"],
    ["vbscript:x"],
    ["tel:+123456"],
    ["markora://something"],
    ["C:\Users\me\secret.txt"],
  ])("never opens %s", (href) => {
    expect(classifyLink(href)).toEqual({ kind: "ignore" });
  });

  it.each([["./other.md"], ["../notes/other.md"], ["other.md"], ["/absolute/path"], ["//evil.example"]])(
    "ignores the relative link %s, which would navigate the app window",
    (href) => {
      expect(classifyLink(href)).toEqual({ kind: "ignore" });
    },
  );

  it("treats #fragment links as in-page anchors", () => {
    expect(classifyLink("#section-2")).toEqual({ kind: "anchor", id: "section-2" });
    expect(classifyLink("#caf%C3%A9")).toEqual({ kind: "anchor", id: "café" });
  });

  it("keeps a malformed escape in an anchor as written instead of throwing", () => {
    expect(classifyLink("#100%")).toEqual({ kind: "anchor", id: "100%" });
  });

  it.each([[null], [""], ["   "], ["#"]])("ignores an empty href %j", (href) => {
    expect(classifyLink(href)).toEqual({ kind: "ignore" });
  });
});
