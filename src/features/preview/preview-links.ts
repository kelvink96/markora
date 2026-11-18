export type LinkTarget =
  | { kind: "external"; url: string }
  | { kind: "anchor"; id: string }
  | { kind: "ignore" };

// The only schemes allowed to leave the app. Anything else (file:, javascript:, data:,
// custom app schemes) is ignored even if it somehow got past sanitizing.
const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    // A stray % that isn't a valid escape: use the text as written.
    return value;
  }
}

/** Decides what clicking a preview link should do, from its raw href attribute. */
export function classifyLink(href: string | null): LinkTarget {
  const value = href?.trim();
  if (!value) return { kind: "ignore" };

  if (value.startsWith("#")) {
    const id = safeDecode(value.slice(1));
    return id ? { kind: "anchor", id } : { kind: "ignore" };
  }

  try {
    // No base URL: relative links like ./other.md throw and are ignored.
    const url = new URL(value);
    return EXTERNAL_PROTOCOLS.has(url.protocol) ? { kind: "external", url: url.href } : { kind: "ignore" };
  } catch {
    return { kind: "ignore" };
  }
}
