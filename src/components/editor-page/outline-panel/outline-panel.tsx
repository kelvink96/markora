import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListTree, X } from "lucide-react";
import { type Ref, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Heading } from "../../../features/outline/extract-headings";
import { slotForDrop } from "../../../features/outline/sections";

interface OutlinePanelProps {
  headings: Heading[];
  /** Index of the heading the cursor is under, or -1. */
  activeIndex: number;
  onSelect: (heading: Heading) => void;
  onClose: () => void;
  /** Words in each heading's section, aligned with `headings`; none are shown without it. */
  wordCounts?: number[];
  /**
   * Moves the section of heading `fromIndex` to just before heading `slot` (`headings.length` is the end of the
   * document). Rows get drag handles only when this is given.
   */
  onMoveSection?: (fromIndex: number, slot: number) => void;
}

const wordsLabel = (count: number) => `${count} ${count === 1 ? "word" : "words"}`;

interface RowProps {
  heading: Heading;
  /** The shallowest level in the document: indentation is relative to it. */
  topLevel: number;
  isActive: boolean;
  /** A sub-section of the section being dragged: invisible, but it keeps its space so nothing shifts mid-drag. */
  concealed?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  wordCount?: number;
  onSelect: (heading: Heading) => void;
}

/** What every row shows, whether or not it can be dragged: the jump-to button and the section's size. */
function RowContent({ heading, topLevel, isActive, buttonRef, wordCount, onSelect }: RowProps) {
  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-current={isActive ? "location" : undefined}
        onClick={() => onSelect(heading)}
        style={{ paddingLeft: `${0.5 + (heading.level - topLevel) * 0.85}rem` }}
        className={cn(
          "relative flex min-w-0 flex-1 cursor-pointer items-center rounded-md py-1.5 pr-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:py-3",
          isActive
            ? "bg-accent font-medium text-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-linear-to-b before:from-brand-from before:to-brand-to"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          heading.level === topLevel && !isActive && "text-foreground",
        )}
      >
        <span className="truncate">{heading.text}</span>
      </button>
      {wordCount === undefined ? null : (
        <span className="shrink-0 pr-2 text-xs tabular-nums text-muted-foreground">{wordsLabel(wordCount)}</span>
      )}
    </>
  );
}

function PlainRow(props: RowProps) {
  return (
    <li className="flex items-center" style={props.concealed ? { visibility: "hidden" } : undefined} aria-hidden={props.concealed || undefined}>
      <RowContent {...props} />
    </li>
  );
}

/** A row that can be dragged, but only by its handle, so the row's own button keeps its click and key behavior. */
function SortableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: String(props.heading.index),
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, visibility: props.concealed ? "hidden" : undefined }}
      aria-hidden={props.concealed || undefined}
      className={cn("group flex items-center gap-0.5", isDragging && "opacity-40")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move section: ${props.heading.text}`}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 group-hover:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100"
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </button>
      <RowContent {...props} />
    </li>
  );
}

export function OutlinePanel({ headings, activeIndex, onSelect, onClose, wordCounts, onMoveSection }: OutlinePanelProps) {
  const activeItem = useRef<HTMLButtonElement>(null);
  // The heading being dragged: its sub-sections travel with it, so their rows are hidden meanwhile.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Keep the current section visible in a long outline as the cursor moves.
  useEffect(() => {
    activeItem.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // A short press, so touching the outline to scroll it doesn't start a drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Indent relative to the shallowest level in the document, so a document that starts at ## isn't pushed right.
  const topLevel = headings.length > 0 ? Math.min(...headings.map((heading) => heading.level)) : 1;

  // While a section is dragged its sub-sections go with it, so their rows are concealed.
  const concealedIndices = useMemo(() => {
    const concealed = new Set<number>();
    if (draggingIndex === null || !headings[draggingIndex]) return concealed;

    const { level } = headings[draggingIndex];
    for (let index = draggingIndex + 1; index < headings.length && headings[index].level > level; index++) {
      concealed.add(index);
    }
    return concealed;
  }, [headings, draggingIndex]);

  const title = (id: string | number) => headings[Number(id)]?.text ?? "";
  const dropSlot = (active: { id: string | number }, over: { id: string | number } | null) =>
    over ? slotForDrop(headings, Number(active.id), Number(over.id)) : null;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up section ${title(active.id)}`,
    onDragOver: ({ active, over }) => (over ? `${title(active.id)} is over ${title(over.id)}` : undefined),
    onDragEnd: ({ active, over }) => {
      const slot = dropSlot(active, over);
      if (slot === null || !over) return "Move cancelled";
      return `Moved ${title(active.id)} ${Number(over.id) < Number(active.id) ? "before" : "after"} ${title(over.id)}`;
    },
    onDragCancel: () => "Move cancelled",
  };

  const handleDragStart = ({ active }: DragStartEvent) => setDraggingIndex(Number(active.id));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingIndex(null);
    const slot = dropSlot(active, over);
    if (slot !== null) onMoveSection?.(Number(active.id), slot);
  };

  const rowFor = (heading: Heading) => {
    const props: RowProps = {
      heading,
      topLevel,
      isActive: heading.index === activeIndex,
      concealed: concealedIndices.has(heading.index),
      buttonRef: heading.index === activeIndex ? activeItem : undefined,
      wordCount: wordCounts?.[heading.index],
      onSelect,
    };
    return onMoveSection ? <SortableRow key={heading.index} {...props} /> : <PlainRow key={heading.index} {...props} />;
  };

  const draggedHeading = draggingIndex === null ? undefined : headings[draggingIndex];

  return (
    <aside aria-label="Outline" data-tour="outline" className="flex h-full w-64 flex-col overflow-hidden rounded-xl border bg-card/80 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ListTree aria-hidden="true" className="size-4 text-muted-foreground" />
          Outline
        </h2>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Close outline" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      {headings.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No headings yet. Start a line with <code className="rounded bg-muted px-1 font-mono text-xs">#</code> to add one.
        </p>
      ) : (
        <nav aria-label="Document headings" className="min-h-0 flex-1 overflow-auto p-1.5">
          {onMoveSection ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setDraggingIndex(null)}
              accessibility={{ announcements }}
            >
              <SortableContext items={headings.map((heading) => String(heading.index))} strategy={verticalListSortingStrategy}>
                <ul className="space-y-0.5">{headings.map(rowFor)}</ul>
              </SortableContext>
              {/* In the page body: the panel's backdrop blur would make a fixed-position overlay sit relative to the panel. */}
              {createPortal(
                <DragOverlay>
                  {draggedHeading ? (
                    <div className="flex items-center justify-between gap-3 rounded-md border bg-popover px-3 py-1.5 text-sm shadow-lg">
                      <span className="truncate font-medium">{draggedHeading.text}</span>
                      {wordCounts?.[draggedHeading.index] === undefined ? null : (
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {wordsLabel(wordCounts[draggedHeading.index])}
                        </span>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
            </DndContext>
          ) : (
            <ul className="space-y-0.5">{headings.map(rowFor)}</ul>
          )}
        </nav>
      )}
    </aside>
  );
}
