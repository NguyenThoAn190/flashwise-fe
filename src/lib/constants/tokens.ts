/**
 * Official Flashwise Brand Design Tokens
 *
 * Single source of truth for color constants, CSS custom properties,
 * elevation shadows, and border radii used throughout the application.
 */

export const QUIZLET_PALETTE = {
  // Brand Primary & Accent Indigo
  INDIGO: "#4255ff",
  INDIGO_HOVER: "#3646db",
  INDIGO_LIGHT: "#eceeff",
  INDIGO_BORDER: "#d3ddff",
  NAVY: "#0a092d",

  // Primary Slate & Typography Colors
  SLATE: "#2e3856",
  TEXT_SECONDARY: "#586380",
  TEXT_MUTED: "#939bb4",

  // Canvas Backgrounds & Elevated Surfaces
  CANVAS: "#f6f7fb",
  SURFACE: "#ffffff",
  SURFACE_HOVER: "#f9fafc",

  // Borders & Dividers
  BORDER: "#d9dde8",
  BORDER_LIGHT: "#edeff4",
  BORDER_HOVER: "#939bb4",
  BORDER_FOCUS: "#4255ff",

  // Feedback & Learning State Colors
  GREEN: "#23b26d",
  GREEN_HOVER: "#1da060",
  GREEN_BG: "#eefbf3",
  GREEN_BORDER: "#a7f3d0",

  CORAL: "#ff725b",
  CORAL_HOVER: "#e65e47",
  CORAL_BG: "#fff0ee",
  CORAL_BORDER: "#fecaca",

  GOLD: "#ffcd1f",
  GOLD_HOVER: "#e5b719",

  WARNING: "#ff983d",
  WARNING_BG: "#fff8ed",
  WARNING_BORDER: "#fed7aa",
} as const;

/**
 * Core brand constants for unit test validation & UI primitive bindings
 */
export const TOKENS = {
  INDIGO: QUIZLET_PALETTE.INDIGO,
  INDIGO_HOVER: QUIZLET_PALETTE.INDIGO_HOVER,
  SLATE: QUIZLET_PALETTE.SLATE,
  CANVAS: QUIZLET_PALETTE.CANVAS,
  SURFACE: QUIZLET_PALETTE.SURFACE,
  BORDER: QUIZLET_PALETTE.BORDER,
  GREEN: QUIZLET_PALETTE.GREEN,
  CORAL: QUIZLET_PALETTE.CORAL,
  GOLD: QUIZLET_PALETTE.GOLD,
} as const;

/**
 * Mapping of CSS custom properties declared in src/app/globals.css
 * to their expected hex values for automated cross-validation.
 */
export const CSS_VARIABLE_MAP = {
  "--quizlet-indigo": QUIZLET_PALETTE.INDIGO,
  "--quizlet-indigo-hover": QUIZLET_PALETTE.INDIGO_HOVER,
  "--quizlet-indigo-light": QUIZLET_PALETTE.INDIGO_LIGHT,
  "--quizlet-indigo-border": QUIZLET_PALETTE.INDIGO_BORDER,
  "--quizlet-deep-navy": QUIZLET_PALETTE.NAVY,
  "--quizlet-slate": QUIZLET_PALETTE.SLATE,
  "--quizlet-text-primary": QUIZLET_PALETTE.SLATE,
  "--quizlet-text-secondary": QUIZLET_PALETTE.TEXT_SECONDARY,
  "--quizlet-text-muted": QUIZLET_PALETTE.TEXT_MUTED,
  "--quizlet-bg-canvas": QUIZLET_PALETTE.CANVAS,
  "--quizlet-surface": QUIZLET_PALETTE.SURFACE,
  "--quizlet-surface-hover": QUIZLET_PALETTE.SURFACE_HOVER,
  "--quizlet-border": QUIZLET_PALETTE.BORDER,
  "--quizlet-border-light": QUIZLET_PALETTE.BORDER_LIGHT,
  "--quizlet-green": QUIZLET_PALETTE.GREEN,
  "--quizlet-green-hover": QUIZLET_PALETTE.GREEN_HOVER,
  "--quizlet-coral": QUIZLET_PALETTE.CORAL,
  "--quizlet-coral-hover": QUIZLET_PALETTE.CORAL_HOVER,
  "--quizlet-gold": QUIZLET_PALETTE.GOLD,
  "--quizlet-warning": QUIZLET_PALETTE.WARNING,
  "--quizlet-warning-border": QUIZLET_PALETTE.WARNING_BORDER,
} as const;

export const SHADOW_TOKENS = {
  card: "0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
  cardHover: "0 8px 24px rgba(46, 56, 86, 0.08), 0 2px 6px rgba(46, 56, 86, 0.04)",
  flashcard3d: "0 8px 30px rgba(0, 0, 0, 0.08)",
  dropdown: "0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
} as const;

export const RADIUS_TOKENS = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  full: "9999px",
} as const;

export type QuizletPalette = typeof QUIZLET_PALETTE;
export type QuizletColorKey = keyof typeof QUIZLET_PALETTE;
