import { useEffect, type RefObject } from "react";

const EDITOR_SCROLLER = ".cm-scroller";
const PREVIEW_SCROLLER = ".preview-pane__surface";

// Setting scrollTop makes the browser fire a scroll event on that pane too. That echo must
// not be mirrored back, or the two panes would fight. Ignored for at most this long.
const ECHO_WINDOW_MS = 100;

/** How far the element can scroll: 0 when its content fits. */
function scrollRange(element: Element) {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

function scrollProgress(element: Element) {
  const range = scrollRange(element);
  return range > 0 ? element.scrollTop / range : 0;
}

/**
 * Keeps the editor and preview at the same scroll proportion while either one is scrolled.
 *
 * Listens on the container in the capture phase (scroll events don't bubble), so it keeps
 * working when CodeMirror is rebuilt and its scroller element is replaced.
 */
export function useScrollSync(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    let echoOf: Element | null = null;
    let echoTimer: ReturnType<typeof setTimeout> | undefined;

    const onScroll = (event: Event) => {
      const source = event.target;
      if (!(source instanceof Element)) return;

      if (source === echoOf) {
        echoOf = null;
        return;
      }

      const fromEditor = source.matches(EDITOR_SCROLLER);
      if (!fromEditor && !source.matches(PREVIEW_SCROLLER)) return;

      const destination = container.querySelector(fromEditor ? PREVIEW_SCROLLER : EDITOR_SCROLLER);
      if (!destination) return;

      const target = scrollProgress(source) * scrollRange(destination);
      if (Math.abs(destination.scrollTop - target) < 1) return;

      echoOf = destination;
      destination.scrollTop = target;
      clearTimeout(echoTimer);
      echoTimer = setTimeout(() => {
        echoOf = null;
      }, ECHO_WINDOW_MS);
    };

    container.addEventListener("scroll", onScroll, true);
    return () => {
      container.removeEventListener("scroll", onScroll, true);
      clearTimeout(echoTimer);
    };
  }, [containerRef, enabled]);
}
