import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FontSizeStepper, SegmentedControl } from "./setting-controls";
import { SettingRow } from "./settings-page-shared";

const SPACING = [
  { value: 1.5, label: "Compact" },
  { value: 1.7, label: "Comfortable" },
  { value: 1.9, label: "Relaxed" },
  { value: 2.1, label: "Spacious" },
];

describe("SegmentedControl", () => {
  it("calls onChange with the clicked option's value", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Line spacing" value={1.7} options={SPACING} onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Relaxed" }));

    expect(onChange).toHaveBeenCalledWith(1.9);
  });

  it("does not call onChange when the selected option is clicked again", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Line spacing" value={1.7} options={SPACING} onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Comfortable" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders with nothing selected when the value is not an option", () => {
    render(<SegmentedControl label="Line spacing" value={1.6} options={SPACING} onChange={() => {}} />);

    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("radio", { checked: true })).toBeNull();
  });
});

describe("FontSizeStepper", () => {
  it("joins the buttons and the value into one ButtonGroup", () => {
    render(<FontSizeStepper value={16} onChange={() => {}} />);

    const group = screen.getByRole("button", { name: "Increase font size" }).closest("[data-slot=button-group]");
    expect(group).not.toBeNull();
    expect(group).toContainElement(screen.getByRole("button", { name: "Decrease font size" }));
    expect(group).toHaveTextContent("16 px");
  });

  it("disables increase at the largest size", () => {
    render(<FontSizeStepper value={24} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Increase font size" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease font size" })).toBeEnabled();
  });

  it("disables decrease at the smallest size", () => {
    render(<FontSizeStepper value={12} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Decrease font size" })).toBeDisabled();
  });

  it("steps through the allowed sizes", async () => {
    const onChange = vi.fn();
    render(<FontSizeStepper value={16} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase font size" }));
    await userEvent.click(screen.getByRole("button", { name: "Decrease font size" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 18);
    expect(onChange).toHaveBeenNthCalledWith(2, 15);
  });

  it("moves an off-list size to the nearest allowed size in each direction", async () => {
    const onChange = vi.fn();
    render(<FontSizeStepper value={17} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase font size" }));
    await userEvent.click(screen.getByRole("button", { name: "Decrease font size" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 18);
    expect(onChange).toHaveBeenNthCalledWith(2, 16);
  });
});

describe("SettingRow", () => {
  it("shows a reset button only when the setting is changed", async () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <SettingRow controlId="x" label="Wrap long lines" changed={false} onReset={onReset}>
        <input id="x" />
      </SettingRow>,
    );
    expect(screen.queryByRole("button", { name: /reset/i })).toBeNull();

    rerender(
      <SettingRow controlId="x" label="Wrap long lines" changed onReset={onReset}>
        <input id="x" />
      </SettingRow>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reset Wrap long lines to default" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
