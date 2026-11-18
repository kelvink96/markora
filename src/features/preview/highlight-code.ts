import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// Only the commonly used languages are bundled (the full set is several times larger). Each also
// answers to its usual aliases (ts, js, py, sh, rs, html, yml, toml, ...).
const LANGUAGES = {
  bash, c, cpp, csharp, css, diff, dockerfile, go, ini, java, javascript, json, kotlin, markdown,
  php, python, ruby, rust, shell, sql, swift, typescript, xml, yaml,
};
for (const [name, definition] of Object.entries(LANGUAGES)) {
  hljs.registerLanguage(name, definition);
}

/** A code block longer than this is left plain: highlighting it would stall typing. */
export const MAX_HIGHLIGHT_LENGTH = 40_000;

const FENCED_CODE = /<pre><code class="[^"]*\blanguage-/;

function languageOf(code: Element) {
  for (const name of code.classList) {
    if (name.startsWith("language-")) return name.slice("language-".length);
  }
  return null;
}

/**
 * Adds syntax highlighting (hljs-* token spans) to fenced code blocks that name a language they
 * know. Blocks with no language, an unknown language, or a huge body are left exactly as they were,
 * and nothing is auto-detected, so the same code always looks the same.
 *
 * The same function runs for both platforms' renderers, so the preview and exports share one set of
 * token classes. The input is parsed in an inert document (nothing in it runs), and callers still
 * sanitize the result.
 */
export function highlightCodeBlocks(html: string): string {
  // Fast path: most documents have no fenced code, and this runs on every keystroke.
  if (!FENCED_CODE.test(html)) return html;

  const document = new DOMParser().parseFromString(html, "text/html");

  for (const code of document.querySelectorAll("pre > code")) {
    const language = languageOf(code);
    const text = code.textContent ?? "";
    if (!language || !hljs.getLanguage(language) || text.length > MAX_HIGHLIGHT_LENGTH) continue;

    code.innerHTML = hljs.highlight(text, { language, ignoreIllegals: true }).value;
    code.classList.add("hljs");
  }

  return document.body.innerHTML;
}
