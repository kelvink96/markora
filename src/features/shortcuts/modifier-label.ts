/** The label for the main shortcut modifier on this machine: "Cmd" on Apple devices, otherwise "Ctrl". */
export function getModifierLabel() {
  if (typeof navigator === "undefined") {
    return "Ctrl";
  }

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "Cmd" : "Ctrl";
}
