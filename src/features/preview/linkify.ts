const BARE_URL = /https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/g;

/**
 * Turns bare http(s) URLs in already-rendered HTML into links. GitHub-flavoured markdown does this
 * itself (the web renderer), but the desktop renderer (pulldown-cmark) does not, and release notes
 * are full of bare pull-request URLs. Text inside links and code is left alone.
 */
export function linkifyBareUrls(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!(node.parentElement?.closest("a, code, pre"))) texts.push(node as Text);
  }

  for (const text of texts) {
    const value = text.data;
    const matches = [...value.matchAll(BARE_URL)];
    if (matches.length === 0) continue;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      const index = match.index ?? 0;
      fragment.append(value.slice(cursor, index));
      const link = document.createElement("a");
      link.href = match[0];
      link.textContent = match[0];
      fragment.append(link);
      cursor = index + match[0].length;
    }
    fragment.append(value.slice(cursor));
    text.replaceWith(fragment);
  }

  return template.innerHTML;
}
