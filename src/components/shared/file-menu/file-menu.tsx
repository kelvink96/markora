import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconButton } from "../icon-button";
import "./file-menu.css";

interface FileMenuProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
}

export function FileMenu({ onNew, onOpen, onSave, onSaveAs }: FileMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <span className="file-menu__trigger">
          <IconButton label="File actions">File</IconButton>
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="file-menu__content" sideOffset={8}>
          <DropdownMenu.Item asChild>
            <button className="file-menu__item" type="button" onClick={onNew}>
              New
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button className="file-menu__item" type="button" onClick={onOpen}>
              Open
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button className="file-menu__item" type="button" onClick={onSave}>
              Save
            </button>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <button className="file-menu__item" type="button" onClick={onSaveAs}>
              Save As
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
