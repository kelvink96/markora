import { ArrowDown, ArrowUp, CaseSensitive, ChevronRight, Regex, WholeWord, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { EditorView } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  applyFind,
  closeFindHighlighting,
  defaultFindOptions,
  goToNextMatch,
  goToPreviousMatch,
  openFindHighlighting,
  replaceCurrentMatch,
  replaceEveryMatch,
  summarizeMatches,
  type FindOptions,
  type MatchSummary,
} from "../../../features/editor/find-replace";

interface FindBarProps {
  /** The live editor; null before it exists. */
  view: EditorView | null;
  /** Start with the replace row open (Ctrl+H) or just find (Ctrl+F). */
  initialMode: "find" | "replace";
  /** Text selected in the editor when the bar opened, used to fill the search box. */
  initialSearch?: string;
  /** Changes whenever the document or selection does, so the match count stays current. */
  version: number;
  onClose: () => void;
}

function describe(summary: MatchSummary, hasSearch: boolean) {
  if (!hasSearch) return "";
  if (!summary.valid) return "Invalid regex";
  if (summary.total === 0) return "No results";
  const total = summary.capped ? `${summary.total}+` : String(summary.total);
  return summary.current > 0 ? `${summary.current} of ${total}` : `${total} ${summary.total === 1 ? "match" : "matches"}`;
}

export function FindBar({ view, initialMode, initialSearch = "", version, onClose }: FindBarProps) {
  const [options, setOptions] = useState<FindOptions>({ ...defaultFindOptions, search: initialSearch });
  const [showReplace, setShowReplace] = useState(initialMode === "replace");
  // Our own commands move the selection, which should refresh the count even if the parent is slow to.
  const [localVersion, setLocalVersion] = useState(0);
  const searchInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const focusReplaceWhenShown = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);
  // Set when a command is run from inside the bar, so focus can be put back if the button it was
  // pressed on disables itself (nothing left to replace) and drops focus to the page.
  const refocusAfterRun = useRef(false);

  // Focus and select the search box each time the bar is opened.
  useEffect(() => {
    searchInput.current?.focus();
    searchInput.current?.select();
  }, []);

  // Ctrl+H opens the replace row and then needs the box that has just appeared.
  useEffect(() => {
    if (showReplace && focusReplaceWhenShown.current) {
      focusReplaceWhenShown.current = false;
      replaceInput.current?.focus();
    }
  }, [showReplace]);

  // Turn on match highlighting while the bar is open, and clear everything when it closes.
  useEffect(() => {
    if (!view) return;
    openFindHighlighting(view);
    return () => {
      applyFind(view, { ...defaultFindOptions });
      closeFindHighlighting(view);
    };
  }, [view]);

  // Keep the editor's highlights and selection in step with what is typed.
  useEffect(() => {
    if (view) applyFind(view, options);
    setLocalVersion((current) => current + 1);
  }, [view, options]);

  useEffect(() => {
    if (!refocusAfterRun.current) return;
    refocusAfterRun.current = false;
    // A button that disables itself can stay "focused" yet stop receiving keys, so that counts as lost.
    const active = document.activeElement as HTMLButtonElement | null;
    const stillUsable = barRef.current?.contains(active) && !active?.disabled;
    if (!stillUsable) searchInput.current?.focus();
  }, [localVersion]);

  const summary = useMemo(
    () => (view ? summarizeMatches(view.state, options) : { total: 0, current: 0, capped: false, valid: true }),
    // `version` and `localVersion` stand in for "the document or selection changed".
    [view, options, version, localVersion],
  );
  const hasSearch = options.search.length > 0;
  const status = describe(summary, hasSearch);

  const run = (command: (view: EditorView) => boolean) => {
    if (!view) return;
    refocusAfterRun.current = barRef.current?.contains(document.activeElement) ?? false;
    command(view);
    setLocalVersion((current) => current + 1);
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      run(event.shiftKey ? goToPreviousMatch : goToNextMatch);
    }
  };

  const onBarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    // The editor's own shortcuts only fire while it has focus; with focus in the bar, handle them
    // here (and keep the browser's own Find / History from taking over).
    const hasModifier = event.ctrlKey || event.metaKey;
    if (hasModifier && event.key.toLowerCase() === "h") {
      event.preventDefault();
      if (showReplace) {
        replaceInput.current?.focus();
      } else {
        focusReplaceWhenShown.current = true;
        setShowReplace(true);
      }
    }
    if (hasModifier && event.key.toLowerCase() === "f") {
      event.preventDefault();
      searchInput.current?.focus();
      searchInput.current?.select();
    }
  };

  const update = (changes: Partial<FindOptions>) => setOptions((current) => ({ ...current, ...changes }));
  const optionToggle = (
    label: string,
    pressed: boolean,
    onPressedChange: (pressed: boolean) => void,
    icon: React.ReactNode,
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" aria-label={label} pressed={pressed} onPressedChange={onPressedChange} className="size-6 min-w-6 px-0">
          {icon}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div
      ref={barRef}
      role="search"
      aria-label="Find and replace"
      onKeyDown={onBarKeyDown}
      className="absolute top-3 right-4 z-20 flex w-[min(26rem,calc(100%-2rem))] gap-1 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-0 slide-in-from-top-2"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={showReplace ? "Hide replace" : "Show replace"}
            aria-expanded={showReplace}
            onClick={() => setShowReplace((current) => !current)}
            className="mt-1 shrink-0"
          >
            <ChevronRight aria-hidden="true" className={cn("transition-transform", showReplace && "rotate-90")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{showReplace ? "Hide replace" : "Show replace"}</TooltipContent>
      </Tooltip>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-1">
          {/* One field: what to find, how many matches, and the case / word / regex options. */}
          <InputGroup className="h-8 min-w-0 flex-1">
            <InputGroupInput
              ref={searchInput}
              value={options.search}
              onChange={(event) => update({ search: event.target.value })}
              onKeyDown={onSearchKeyDown}
              placeholder="Find"
              aria-label="Find"
              aria-invalid={!summary.valid}
              aria-describedby="find-status"
              spellCheck={false}
              className="h-full"
            />
            <InputGroupAddon align="inline-end" className="gap-0.5">
              <InputGroupText
                id="find-status"
                role="status"
                aria-live="polite"
                className={cn("pr-1 text-xs tabular-nums whitespace-nowrap", summary.valid ? "text-muted-foreground" : "text-destructive")}
              >
                {status}
              </InputGroupText>
              {optionToggle("Match case", options.caseSensitive, (caseSensitive) => update({ caseSensitive }), <CaseSensitive aria-hidden="true" />)}
              {optionToggle("Match whole word", options.wholeWord, (wholeWord) => update({ wholeWord }), <WholeWord aria-hidden="true" />)}
              {optionToggle("Use regular expression", options.regexp, (regexp) => update({ regexp }), <Regex aria-hidden="true" />)}
            </InputGroupAddon>
          </InputGroup>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Previous match" disabled={summary.total === 0} onClick={() => run(goToPreviousMatch)}>
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Next match" disabled={summary.total === 0} onClick={() => run(goToNextMatch)}>
            <ArrowDown aria-hidden="true" />
          </Button>
        </div>

        {showReplace ? (
          <div className="flex items-center gap-1">
            <InputGroup className="h-8 min-w-0 flex-1">
              <InputGroupInput
                ref={replaceInput}
                value={options.replace}
                onChange={(event) => update({ replace: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    run(replaceCurrentMatch);
                  }
                }}
                placeholder="Replace"
                aria-label="Replace"
                spellCheck={false}
                className="h-full"
              />
            </InputGroup>
            <Button type="button" variant="outline" size="sm" disabled={summary.total === 0} onClick={() => run(replaceCurrentMatch)}>
              Replace
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={summary.total === 0} onClick={() => run(replaceEveryMatch)}>
              All
            </Button>
          </div>
        ) : null}
      </div>

      <Button type="button" variant="ghost" size="icon-xs" aria-label="Close find" onClick={onClose} className="shrink-0">
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
