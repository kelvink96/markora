import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultNewDocumentTemplate } from "../../features/settings/settings-schema";
import { TemplateDialog } from "./template-dialog";

async function openDialog() {
  await userEvent.click(screen.getByRole("button", { name: "Edit template…" }));
  return screen.getByRole("textbox", { name: "Template content" });
}

describe("TemplateDialog", () => {
  it("lays out the template box as a labelled Field", async () => {
    render(<TemplateDialog template="old" onSave={() => {}} />);

    const textarea = await openDialog();
    expect(textarea.closest("[data-slot=field]")).not.toBeNull();
    expect(screen.getByText("Template content")).toHaveAttribute("data-slot", "field-label");
  });

  it("saves the edited draft and closes", async () => {
    const onSave = vi.fn();
    render(<TemplateDialog template="old" onSave={onSave} />);

    const textarea = await openDialog();
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "new text");
    await userEvent.click(screen.getByRole("button", { name: "Save template" }));

    expect(onSave).toHaveBeenCalledWith("new text");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resets only the draft to the default template", async () => {
    const onSave = vi.fn();
    render(<TemplateDialog template="old" onSave={onSave} />);

    const textarea = await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "Reset template" }));

    expect(textarea).toHaveValue(defaultNewDocumentTemplate);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("discards the draft on Escape and reopens with the saved template", async () => {
    const onSave = vi.fn();
    render(<TemplateDialog template="saved" onSave={onSave} />);

    const textarea = await openDialog();
    await userEvent.type(textarea, " edited");
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
    expect(await openDialog()).toHaveValue("saved");
  });
});
