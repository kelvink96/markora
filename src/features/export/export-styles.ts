/**
 * The stylesheet for exported documents (HTML files and PDF). It is deliberately independent of the
 * app's theme: an exported file is read elsewhere, so it always uses a clean light, print-friendly
 * look. `scope` is the selector everything is nested under: "body" for a standalone file, or
 * "#print-root" when printing from inside the app.
 */
export function exportCss(scope: string): string {
  const s = scope;
  return `
${s} {
  color: #1c1b29;
  background: #ffffff;
  font-family: "Source Serif 4", "Iowan Old Style", Georgia, serif;
  font-size: 12pt;
  line-height: 1.7;
}
${s} .markora-document { max-width: 72ch; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6 {
  font-family: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.2;
  letter-spacing: -0.02em;
  break-after: avoid;
}
${s} h1 { font-size: 2.2em; margin: 0 0 1.2rem; }
${s} h2 { font-size: 1.6em; margin: 2rem 0 0.8rem; }
${s} h3 { font-size: 1.25em; margin: 1.5rem 0 0.6rem; }
${s} p, ${s} ul, ${s} ol, ${s} blockquote, ${s} pre, ${s} table { margin: 0 0 1rem; }
${s} a { color: #4338ca; text-underline-offset: 0.18em; }
${s} ul, ${s} ol { padding-left: 1.4rem; }
${s} ul { list-style-type: disc; }
${s} ol { list-style-type: decimal; }
${s} li:has(> input[type="checkbox"]) { list-style-type: none; }
${s} li > input[type="checkbox"] { margin: 0 0.5rem 0 -1.4rem; }
${s} blockquote { padding: 0.4rem 1rem; border-left: 3px solid #6d5dfc; background: #f4f3ff; color: #4a4863; font-style: italic; }
${s} code { font-family: "IBM Plex Mono", ui-monospace, Consolas, monospace; font-size: 0.88em; background: #f1f0f7; border: 1px solid #e2e0ee; border-radius: 4px; padding: 0.1rem 0.35rem; }
${s} pre { overflow: auto; padding: 0.9rem 1.1rem; background: #f6f5fb; border: 1px solid #e2e0ee; border-radius: 8px; line-height: 1.55; break-inside: avoid; }
${s} pre code { background: none; border: 0; padding: 0; font-size: 0.88em; }
${s} table { width: 100%; border-collapse: collapse; font-family: "Geist", system-ui, sans-serif; font-size: 0.92em; }
${s} th, ${s} td { padding: 0.5rem 0.7rem; border-bottom: 1px solid #e2e0ee; text-align: left; vertical-align: top; }
${s} th { background: #f4f3ff; font-weight: 600; }
${s} img { max-width: 100%; height: auto; border-radius: 6px; }
${s} hr { border: 0; border-top: 1px solid #e2e0ee; margin: 2rem 0; }
@media print {
  ${s} { font-size: 11pt; }
  ${s} .markora-document { max-width: none; padding: 0; }
  ${s} a { color: inherit; }
  ${s} img, ${s} table { break-inside: avoid; }
}
`;
}
