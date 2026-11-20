import { Kbd, KbdGroup } from "@/components/ui/kbd";

/** The keys of a shortcut such as "Ctrl+Shift+S", as separate key caps in one group. */
export function ShortcutKeys({ shortcut }: { shortcut: string }) {
  // A lone "+" is the key itself, not a separator.
  const keys = shortcut === "+" ? ["+"] : shortcut.split("+");

  return (
    <KbdGroup>
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`}>{key}</Kbd>
      ))}
    </KbdGroup>
  );
}

/** Each rendered shortcut inside `root`, joined back into "Ctrl+Shift+S" form. */
export function readShortcuts(root: ParentNode): string[] {
  return [...root.querySelectorAll("[data-slot=kbd-group]")].map((group) =>
    [...group.querySelectorAll("[data-slot=kbd]")].map((key) => key.textContent).join("+"),
  );
}
