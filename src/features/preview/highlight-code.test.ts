import { describe, expect, it } from "vitest";
import { MAX_HIGHLIGHT_LENGTH, highlightCodeBlocks } from "./highlight-code";

const block = (language: string | null, code: string) =>
  `<pre><code${language ? ` class="language-${language}"` : ""}>${code}</code></pre>`;

describe("highlightCodeBlocks", () => {
  it("adds token spans to a fenced block in a known language", () => {
    const html = highlightCodeBlocks(block("ts", "const answer: number = 42;"));

    expect(html).toContain('class="hljs-keyword"');
    expect(html).toContain('class="hljs-number"');
    expect(html).toContain('<code class="language-ts hljs">');
  });

  it("keeps the code text exactly as written", () => {
    const html = highlightCodeBlocks(block("ts", "const a = 1;"));

    const text = new DOMParser().parseFromString(html, "text/html").querySelector("code")?.textContent;
    expect(text).toBe("const a = 1;");
  });

  it.each([
    ["js", "const x = 1", "hljs-keyword"],
    ["javascript", "function f() {}", "hljs-keyword"],
    ["tsx", "const x: string = 'a'", "hljs-keyword"],
    ["py", "def f(): return 1", "hljs-keyword"],
    ["python", "# note", "hljs-comment"],
    ["rs", "fn main() {}", "hljs-keyword"],
    ["rust", "let x = 5;", "hljs-keyword"],
    ["go", "func main() {}", "hljs-keyword"],
    ["sh", "echo $HOME", "hljs-variable"],
    ["bash", "# comment", "hljs-comment"],
    ["json", '{"a": 1}', "hljs-attr"],
    ["css", "a { color: red; }", "hljs-selector-tag"],
    ["html", "&lt;div class=&quot;x&quot;&gt;&lt;/div&gt;", "hljs-tag"],
    ["yml", "key: value", "hljs-attr"],
    ["sql", "SELECT * FROM t;", "hljs-keyword"],
    ["diff", "+added\n-removed", "hljs-addition"],
  ])("knows %s", (language, code, expectedClass) => {
    expect(highlightCodeBlocks(block(language, code))).toContain(expectedClass);
  });

  it("leaves an unknown language alone", () => {
    const original = block("klingon", "qapla'");

    expect(highlightCodeBlocks(original)).toBe(original);
  });

  it("doesn't guess a language for a block that doesn't name one", () => {
    const original = `<p>text</p>${block(null, "const a = 1;")}`;

    expect(highlightCodeBlocks(original)).toBe(original);
  });

  it("returns documents without fenced code untouched (the fast path, since this runs on every keystroke)", () => {
    const original = "<h1>Title</h1><p>Some <code>inline</code> code</p>";

    expect(highlightCodeBlocks(original)).toBe(original);
  });

  it("leaves inline code alone even when a block is highlighted", () => {
    const html = highlightCodeBlocks(`<p>use <code class="language-ts">const</code> here</p>${block("ts", "let a;")}`);

    expect(html).toContain('<code class="language-ts">const</code>');
  });

  it("keeps markup in the code as text: nothing inside a code block can become an element", () => {
    const html = highlightCodeBlocks(block("html", "&lt;script&gt;alert(1)&lt;/script&gt;"));

    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;");
    expect(new DOMParser().parseFromString(html, "text/html").querySelector("script")).toBeNull();
  });

  it("highlights every block in a document", () => {
    const html = highlightCodeBlocks(`${block("ts", "let a;")}<p>between</p>${block("py", "def f(): pass")}`);

    expect(html.match(/<code class="[^"]*hljs"/g)).toHaveLength(2);
  });

  it("handles a language class mixed with other classes", () => {
    const html = highlightCodeBlocks('<pre><code class="foo language-ts bar">let a;</code></pre>');

    expect(html).toContain("hljs-keyword");
  });

  it("leaves a huge block plain so typing stays responsive", () => {
    const original = block("js", "a".repeat(MAX_HIGHLIGHT_LENGTH + 1));

    expect(highlightCodeBlocks(original)).toBe(original);
  });

  it("tolerates code that isn't valid for its language", () => {
    expect(() => highlightCodeBlocks(block("json", "{ not: valid,, "))).not.toThrow();
  });
});
