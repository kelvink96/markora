import type { SlashCommandDefinition } from "../../../features/editor/slash-commands";

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
    <div
      className="absolute z-30 w-72 overflow-hidden rounded-[18px] border border-[color:var(--ghost-border)] bg-app-panel-strong/98 shadow-[0_18px_40px_rgba(30,43,52,0.16)] backdrop-blur-md"
      style={{ top: position.top, left: position.left }}
    >
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
    </div>
  );
}
