import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./tests/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quizlet: {
          indigo: {
            DEFAULT: "var(--quizlet-indigo, #4255ff)",
            hover: "var(--quizlet-indigo-hover, #3646db)",
            light: "var(--quizlet-indigo-light, #eceeff)",
            border: "var(--quizlet-indigo-border, #d3ddff)",
          },
          slate: {
            DEFAULT: "var(--quizlet-slate, #2e3856)",
            text: "var(--quizlet-text-primary, #2e3856)",
            secondary: "var(--quizlet-text-secondary, #586380)",
            muted: "var(--quizlet-text-muted, #939bb4)",
          },
          canvas: "var(--quizlet-bg-canvas, #f6f7fb)",
          surface: {
            DEFAULT: "var(--quizlet-surface, #ffffff)",
            hover: "var(--quizlet-surface-hover, #f9fafc)",
          },
          border: {
            DEFAULT: "var(--quizlet-border, #d9dde8)",
            light: "var(--quizlet-border-light, #edeff4)",
            hover: "var(--quizlet-border-hover, #939bb4)",
            focus: "var(--quizlet-border-focus, #4255ff)",
          },
          green: {
            DEFAULT: "var(--quizlet-green, #23b26d)",
            hover: "var(--quizlet-green-hover, #1da060)",
            bg: "var(--quizlet-green-bg, #eefbf3)",
            border: "var(--quizlet-green-border, #a7f3d0)",
          },
          coral: {
            DEFAULT: "var(--quizlet-coral, #ff725b)",
            hover: "var(--quizlet-coral-hover, #e65e47)",
            bg: "var(--quizlet-coral-bg, #fff0ee)",
            border: "var(--quizlet-coral-border, #fecaca)",
          },
          gold: {
            DEFAULT: "var(--quizlet-gold, #ffcd1f)",
            hover: "var(--quizlet-gold-hover, #e5b719)",
          },
          warning: {
            DEFAULT: "var(--quizlet-warning, #ff983d)",
            bg: "var(--quizlet-warning-bg, #fff8ed)",
            border: "var(--quizlet-warning-border, #fed7aa)",
          },
          navy: "var(--quizlet-deep-navy, #0a092d)",
        },
      },
      fontFamily: {
        sans: [
          "Hurme Geometric Sans No2",
          "Hurme Geometric Sans",
          "var(--font-hurme)",
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        hurme: [
          "Hurme Geometric Sans No2",
          "Hurme Geometric Sans",
          "var(--font-hurme)",
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "var(--shadow-card, 0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02))",
        "card-hover": "var(--shadow-card-hover, 0 8px 24px rgba(46, 56, 86, 0.08), 0 2px 6px rgba(46, 56, 86, 0.04))",
        "flashcard-3d": "var(--shadow-flashcard-3d, 0 8px 30px rgba(0, 0, 0, 0.08))",
        dropdown: "var(--shadow-dropdown, 0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04))",
      },
      borderRadius: {
        sm: "var(--radius-sm, 8px)",
        md: "var(--radius-md, 12px)",
        lg: "var(--radius-lg, 16px)",
        xl: "var(--radius-xl, 20px)",
        "2xl": "var(--radius-2xl, 24px)",
        quizlet: "8px",
        "quizlet-card": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
