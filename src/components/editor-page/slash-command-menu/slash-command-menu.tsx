import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import type { SlashCommandDefinition } from "../../../features/editor/slash-commands";
import { FloatingPanel } from "../floating-panel";

interface SlashCommandMenuProps {
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  position: {
    top: number;
    left: number;
  };
  onSelect: (id: SlashCommandDefinition["id"]) => void;
}

export function SlashCommandMenu({ commands, selectedIndex, position, onSelect }: SlashCommandMenuProps) {
  return (
    <FloatingPanel position={position} className="w-72">
      <div role="listbox" aria-label="Slash commands" className="max-h-80 overflow-y-auto p-1">
        {commands.map((command, index) => (
          <button
            key={command.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            // Keep focus (and the caret) in the editor while picking a command.
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              "flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors",
              index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
            )}
            onClick={() => onSelect(command.id)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-5">{command.label}</span>
              <span className="block text-xs leading-4 text-muted-foreground">{command.description}</span>
            </span>
            <Kbd className="shrink-0">/{command.aliases[0]}</Kbd>
          </button>
        ))}
      </div>
    </FloatingPanel>
  );
}
