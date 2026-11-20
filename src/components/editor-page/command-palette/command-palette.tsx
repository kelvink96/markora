import { Fragment } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { scorePaletteCommand, type PaletteCommand, type PaletteGroup } from "../../../features/commands/palette-commands";
import { Badge } from "@/components/ui/badge";
import { COMMAND_ICONS } from "../top-bar/command-icons";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: PaletteCommand[];
}

const GROUP_ORDER: PaletteGroup[] = ["File", "Edit", "Format", "View", "App", "Help"];

/** Ctrl/Cmd+K palette: type to filter every app command, Enter to run, Esc to close. */
export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: commands.filter((command) => command.group === group),
  })).filter(({ items }) => items.length > 0);

  const runCommand = (command: PaletteCommand) => {
    // Close first so focus is released before the command moves it (a dialog, the editor).
    onOpenChange(false);
    command.run();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      // Each item carries [label, ...keywords]; see scorePaletteCommand for why this is not fuzzy.
      filter={(_value, search, keywords) => scorePaletteCommand(search, keywords?.[0] ?? "", keywords?.slice(1))}
      title="Command palette"
      description="Search for a command and press Enter to run it"
    >
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        {groups.map(({ group, items }, index) => (
          <Fragment key={group}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group}>
              {items.map((command) => {
                const Icon = COMMAND_ICONS[command.icon ?? command.id];
                return (
                  <CommandItem key={command.id} value={command.id} keywords={[command.label, ...(command.keywords ?? [])]} onSelect={() => runCommand(command)}>
                    {Icon ? <Icon aria-hidden="true" className={command.busy ? "animate-spin" : undefined} /> : null}
                    <span>{command.label}</span>
                    {command.badge ? <Badge className="ml-auto">{command.badge}</Badge> : null}
                    {command.shortcut ? <CommandShortcut>{command.shortcut}</CommandShortcut> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
