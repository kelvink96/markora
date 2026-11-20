/**
 * The colour schemes, in the order Settings, the View menu and the command palette show them.
 *
 * This is the one list to extend. A new scheme also needs its palette blocks in `styles/themes.css`
 * (theme-contrast.test.ts fails until both modes exist and pass contrast) and a variant in the
 * `ColorScheme` enum of `src-tauri/src/commands/settings.rs` (color-schemes.test.ts checks they match).
 * `id` is what gets saved in the settings file, so existing ids never change.
 */
export const COLOR_SCHEMES = [
  {
    id: "standard",
    name: "Aurora",
    description: "Cool indigo with a violet-to-cyan glow",
    keywords: ["default", "standard", "indigo"],
    themeColor: { light: "#f9fafe", dark: "#090b16" },
  },
  {
    id: "sepia",
    name: "Ember",
    description: "Warm graphite and amber, cream paper in light",
    keywords: ["sepia", "warm", "paper"],
    themeColor: { light: "#faf3e5", dark: "#130d09" },
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Maximum contrast, no decoration",
    keywords: ["accessible", "contrast"],
    themeColor: { light: "#ffffff", dark: "#000000" },
  },
  {
    id: "moss",
    name: "Moss",
    description: "Muted green on warm grey, easy on the eyes",
    keywords: ["green", "forest", "everforest", "nature"],
    themeColor: { light: "#f8f5e5", dark: "#0d1916" },
  },
  {
    id: "frost",
    name: "Frost",
    description: "Calm arctic blue-grey, low glare",
    keywords: ["blue", "nord", "arctic", "cool"],
    themeColor: { light: "#f0f4f9", dark: "#1b222b" },
  },
  {
    id: "rose",
    name: "Rosé",
    description: "Dusty rose and gold, cream dawn in light",
    keywords: ["rose", "pink", "pine", "soft", "pastel"],
    themeColor: { light: "#fcf4eb", dark: "#171322" },
  },
] as const;

export type ColorScheme = (typeof COLOR_SCHEMES)[number]["id"];

export const COLOR_SCHEME_IDS: readonly ColorScheme[] = COLOR_SCHEMES.map((scheme) => scheme.id);
