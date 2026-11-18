import {
  closeSearchPanel,
  findNext,
  findPrevious,
  openSearchPanel,
  replaceAll,
  replaceNext,
  search,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import type { EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/** What the user typed into the find bar. */
export interface FindOptions {
  search: string;
  replace: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  regexp: boolean;
}

export const defaultFindOptions: FindOptions = {
  search: "",
  replace: "",
  caseSensitive: false,
  wholeWord: false,
  regexp: false,
};

/** Counting stops here, so a one-letter search in a huge document stays instant. */
export const MATCH_LIMIT = 2000;

export interface MatchSummary {
  /** How many matches there are (up to MATCH_LIMIT). */
  total: number;
  /** 1-based position of the selected match, or 0 when the selection isn't on one. */
  current: number;
  /** True when counting stopped at MATCH_LIMIT. */
  capped: boolean;
  /** False when a regular expression doesn't parse. */
  valid: boolean;
}

/**
 * CodeMirror needs the search extension installed for match highlighting and for the search
 * commands. We draw our own find bar, so its built-in panel is replaced by an empty one.
 */
export const findExtensions: Extension[] = [
  search({ top: true, createPanel: () => ({ dom: document.createElement("div") }) }),
];

/**
 * CodeMirror only draws match highlights while its search panel is open. Ours is an empty panel
 * (hidden in the editor theme), so opening and closing it is how highlighting is switched on and off.
 */
export function openFindHighlighting(view: EditorView) {
  openSearchPanel(view);
}

export function closeFindHighlighting(view: EditorView) {
  closeSearchPanel(view);
}

export function buildQuery(options: FindOptions) {
  return new SearchQuery({
    search: options.search,
    replace: options.replace,
    caseSensitive: options.caseSensitive,
    wholeWord: options.wholeWord,
    regexp: options.regexp,
  });
}

function matchesOf(state: EditorState, options: FindOptions) {
  const query = buildQuery(options);
  const found: Array<{ from: number; to: number }> = [];
  if (!options.search || !query.valid) return { found, query, capped: false };

  const cursor = query.getCursor(state);
  for (let step = cursor.next(); !step.done; step = cursor.next()) {
    found.push(step.value);
    if (found.length >= MATCH_LIMIT) return { found, query, capped: true };
  }
  return { found, query, capped: false };
}

/** Counts matches and finds which one the selection is on. */
export function summarizeMatches(state: EditorState, options: FindOptions): MatchSummary {
  const query = buildQuery(options);
  if (!options.search) return { total: 0, current: 0, capped: false, valid: true };
  if (!query.valid) return { total: 0, current: 0, capped: false, valid: false };

  const { found, capped } = matchesOf(state, options);
  const selection = state.selection.main;
  const index = found.findIndex((match) => match.from === selection.from && match.to === selection.to);

  return { total: found.length, current: index + 1, capped, valid: true };
}

/**
 * Highlights every match for these options, and moves the selection to the first match at or after
 * the cursor (wrapping to the start), so typing a search jumps to a result without skipping past it.
 */
export function applyFind(view: EditorView, options: FindOptions) {
  const query = buildQuery(options);
  const effects = [setSearchQuery.of(query)];
  const { found } = matchesOf(view.state, options);
  const cursor = view.state.selection.main.from;
  const target = found.find((match) => match.from >= cursor) ?? found[0];

  view.dispatch({
    effects: target ? [...effects, EditorView.scrollIntoView(target.from, { y: "center" })] : effects,
    selection: target ? { anchor: target.from, head: target.to } : undefined,
  });
}

export const goToNextMatch = (view: EditorView) => findNext(view);
export const goToPreviousMatch = (view: EditorView) => findPrevious(view);
export const replaceCurrentMatch = (view: EditorView) => replaceNext(view);
export const replaceEveryMatch = (view: EditorView) => replaceAll(view);
