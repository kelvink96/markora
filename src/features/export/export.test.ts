import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarkdownAdapter } from "../../platform/markdown/types";
import { exportCss } from "./export-styles";
import { buildHtmlDocument, renderExportBody } from "./html-document";
import { printDocument } from "./print-document";

describe("exportCss", () => {
  it("nests every rule under the scope, so printing can't restyle the app", () => {
    const css = exportCss("#print-root");

    // No rule may start with a bare selector: each line that opens a rule begins with the scope.
    const ruleLines = css.split("\n").filter((line) => line.includes("{") && !line.startsWith("@") && line.trim());
    expect(ruleLines.length).toBeGreaterThan(10);
    for (const line of ruleLines) {
      expect(line.trim().startsWith("#print-root")).toBe(true);
    }
  });

  it("styles the main kinds of content", () => {
    const css = exportCss("body");

    for (const selector of ["h1", "pre", "blockquote", "table", "img", "li:has(> input"]) {
      expect(css).toContain(selector);
    }
  });

  it("colours the code tokens the highlighter produces, with the scope applied", () => {
    const css = exportCss("#print-root");

    for (const token of ["hljs-keyword", "hljs-string", "hljs-comment", "hljs-number", "hljs-title"]) {
      expect(css).toContain(`#print-root .${token}`);
    }
  });

  it("is always a light, print-friendly look whatever theme the app is in", () => {
    expect(exportCss("body")).toContain("background: #ffffff");
  });
});

describe("buildHtmlDocument", () => {
  const html = buildHtmlDocument({ title: "My Note", bodyHtml: "<h1>Hi</h1><p>text</p>" });

  it("is a complete standalone HTML document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("<title>My Note</title>");
    expect(html).toContain("<h1>Hi</h1><p>text</p>");
    expect(html).toContain("<style>");
  });

  it("makes no external requests: no stylesheet links, scripts or remote fonts", () => {
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toContain("@import");
    expect(html).not.toContain("fonts.googleapis.com");
  });

  it("escapes the title so a document title can't inject markup", () => {
    const hostile = buildHtmlDocument({ title: '</title><script>alert("x")</script>', bodyHtml: "" });

    expect(hostile).not.toContain("<script>alert");
    expect(hostile).toContain("&lt;/title&gt;&lt;script&gt;");
  });
});

describe("renderExportBody", () => {
  const adapter = (html: string): MarkdownAdapter => ({ render: vi.fn().mockResolvedValue(html) });

  it("strips scripts and javascript: links so an export can't carry code", async () => {
    const body = await renderExportBody("x", adapter('<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>'));

    expect(body).toContain("<p>ok</p>");
    expect(body).not.toContain("<script");
    expect(body).not.toContain("javascript:");
  });

  it("highlights fenced code, and still strips anything dangerous", async () => {
    const body = await renderExportBody(
      "x",
      adapter('<pre><code class="language-js">const a = 1;</code></pre><script>alert(1)</script>'),
    );

    expect(body).toContain("hljs-keyword");
    expect(body).not.toContain("<script");
  });

  it("leaves relative image links as written", async () => {
    const body = await renderExportBody("x", adapter('<img src="./diagram.png" alt="d">'));

    expect(body).toContain('src="./diagram.png"');
  });

  it("renders without a document path, so images aren't rewritten to app-only URLs", async () => {
    const markdown = adapter("<p>x</p>");

    await renderExportBody("# T", markdown);

    expect(markdown.render).toHaveBeenCalledWith("# T", { documentPath: null });
  });
});

describe("printDocument", () => {
  beforeEach(() => {
    document.title = "Markora";
    vi.spyOn(window, "print").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    document.getElementById("print-root")?.remove();
    document.getElementById("print-root-style")?.remove();
  });

  it("puts the document in a print view and opens the print dialog", () => {
    printDocument({ title: "My Note", bodyHtml: "<h1>Hi</h1>" });

    expect(window.print).toHaveBeenCalledTimes(1);
    expect(document.getElementById("print-root")?.innerHTML).toContain("<h1>Hi</h1>");
  });

  it("names the page after the document while printing, so the PDF gets a good file name", () => {
    printDocument({ title: "My Note", bodyHtml: "" });

    expect(document.title).toBe("My Note");
  });

  it("hides the print view on screen and everything else when printing", () => {
    printDocument({ title: "t", bodyHtml: "" });

    const css = document.getElementById("print-root-style")?.textContent ?? "";
    expect(css).toContain("@media screen { #print-root { display: none; } }");
    expect(css).toMatch(/@media print[\s\S]*display: none !important/);
  });

  it("puts the app back exactly as it was once printing finishes", () => {
    printDocument({ title: "My Note", bodyHtml: "<p>x</p>" });

    window.dispatchEvent(new Event("afterprint"));

    expect(document.getElementById("print-root")).toBeNull();
    expect(document.getElementById("print-root-style")).toBeNull();
    expect(document.title).toBe("Markora");
  });

  it("cleans up only once, however many times afterprint fires", () => {
    printDocument({ title: "My Note", bodyHtml: "" });

    window.dispatchEvent(new Event("afterprint"));
    document.title = "Changed later";
    window.dispatchEvent(new Event("afterprint"));

    expect(document.title).toBe("Changed later");
  });
});
