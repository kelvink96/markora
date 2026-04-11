import { describe, expect, it } from "vitest";
import { webMarkdownAdapter } from "./web";

describe("webMarkdownAdapter", () => {
  it("renders headings and emphasis", async () => {
    const html = await webMarkdownAdapter.render("# Hello\n\n**world**");

    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<strong>world</strong>");
  });

  it("renders fenced code blocks", async () => {
    const html = await webMarkdownAdapter.render("```ts\nconst answer = 42;\n```");

    expect(html).toContain("<pre><code");
    expect(html).toContain("const answer = 42;");
  });

  it("renders GitHub-flavored tables and task lists", async () => {
    const html = await webMarkdownAdapter.render(
      "| A | B |\n| --- | --- |\n| 1 | 2 |\n\n- [x] done",
    );

    expect(html).toContain("<table>");
    expect(html).toContain('type="checkbox"');
  });
});
