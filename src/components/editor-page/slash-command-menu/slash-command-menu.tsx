import type { SlashCommandDefinition } from "../../../features/editor/slash-commands";
import { FloatingMenu } from "../../shared/floating-menu";

interface SlashCommandMenuProps {
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  position: {
    top: number;
    left: number;
  };
  onSelect: (id: SlashCommandDefinition["id"]) => void;
}

export function SlashCommandMenu({
  commands,
  selectedIndex,
  position,
  onSelect,
}: SlashCommandMenuProps) {
  return (
    <FloatingMenu position={position} className="w-72">
      <div role="listbox" aria-label="Slash commands" className="max-h-80 overflow-y-auto p-1.5">
        {commands.map((command, index) => (
          <button
            key={command.id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            className={`flex w-full items-start justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left transition ${
              index === selectedIndex
                ? "bg-app-subtle text-app-text"
                : "text-app-text-secondary hover:bg-app-subtle/70 hover:text-app-text"
            }`}
            onClick={() => onSelect(command.id)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-5 text-inherit">
                {command.label}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-app-text-muted">
                {command.description}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-app-editor px-2 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-app-text-muted">
              /{command.aliases[0]}
            </span>
          </button>
        ))}
      </div>
    </FloatingMenu>
  );
}
