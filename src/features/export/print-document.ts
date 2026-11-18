import { exportCss } from "./export-styles";

const PRINT_ROOT_ID = "print-root";
const PRINT_STYLE_ID = "print-root-style";

/**
 * Prints a document through the system print dialog (which can save as PDF): it puts the rendered
 * body in a dedicated element, hides the whole app while printing, then puts everything back.
 * Works in browsers and in the desktop webview.
 */
export function printDocument({ title, bodyHtml }: { title: string; bodyHtml: string }) {
  const previousTitle = document.title;

  const root = document.createElement("div");
  root.id = PRINT_ROOT_ID;
  root.innerHTML = `<main class="markora-document">${bodyHtml}</main>`;

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  // On screen the print view must never show; when printing, only it shows.
  style.textContent = `
@media screen { #${PRINT_ROOT_ID} { display: none; } }
@media print {
  body > *:not(#${PRINT_ROOT_ID}):not(#${PRINT_STYLE_ID}) { display: none !important; }
  html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
}
@page { margin: 18mm; }
${exportCss(`#${PRINT_ROOT_ID}`)}`;

  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    root.remove();
    style.remove();
    document.title = previousTitle;
  };
  window.addEventListener("afterprint", cleanup);

  document.body.append(style, root);
  // The browser uses the page title as the suggested PDF file name.
  document.title = title;
  window.print();
}
