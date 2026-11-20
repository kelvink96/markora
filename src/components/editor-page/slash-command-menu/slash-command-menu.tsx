import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import type { SlashCommandDefinition } from "../../../features/editor/slash-commands";
import { FloatingPanel } from "../floating-panel";

interface SlashCommandMenuProps {
  /** The listbox id; the editor points at it (aria-controls) and at the highlighted option (aria-activedescendant). */
  id?: string;
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  position: {
    top: number;
    left: number;
  };
  onSelect: (id: SlashCommandDefinition["id"]) => void;
}

/** The id of the option at `index`, so the editor can name it as its active descendant. */
export const slashOptionId = (listboxId: string, index: number) => `${listboxId}-option-${index}`;

/**
 * The popup half of a combobox whose input is the editor itself: focus never leaves the editor, which
 * moves the highlight with the arrow keys and points at it, so the options are not focusable.
 */
export function SlashCommandMenu({ id = "slash-commands", commands, selectedIndex, position, onSelect }: SlashCommandMenuProps) {
  return (
    <FloatingPanel position={position} className="w-72">
      <div id={id} role="listbox" aria-label="Slash commands" className="max-h-80 overflow-y-auto p-1">
        {commands.map((command, index) => (
          <div
            key={command.id}
            id={slashOptionId(id, index)}
            role="option"
            aria-selected={index === selectedIndex}
            // Keep focus (and the caret) in the editor while picking a command.
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              "flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors",
              index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
            )}
            onClick={() => onSelect(command.id)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-5">{command.label}</span>
              <span className="block text-xs leading-4 text-muted-foreground">{command.description}</span>
            </span>
            <Kbd className="shrink-0">/{command.aliases[0]}</Kbd>
          </div>
        ))}
      </div>
    </FloatingPanel>
  );
}
