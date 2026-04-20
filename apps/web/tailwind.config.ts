import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"DM Sans"', "system-ui", "sans-serif"],
        serif: ['"DM Serif Display"', "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand violet palette (from 02-dashboard.html)
        brand: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#8B5CF6",
          500: "#5925a8",
          600: "#4a1d96",
          700: "#3b1584",
          800: "#2e0f5c",
          900: "#1E1B4B",
        },
        // Purple-tinted slate (from 02-dashboard.html)
        slate: {
          25:  "#FDFCFE",
          50:  "#FAF8FF",
          75:  "#F0EDF8",
          100: "#E9E5F5",
          150: "#D6D0E8",
          200: "#D6D0E8",
          300: "#A8A0C0",
          400: "#A8A0C0",
          500: "#7C7399",
          600: "#3B3566",
          700: "#3B3566",
          800: "#1E1B4B",
          900: "#1E1B4B",
          950: "#0e1118",
        },
        // Semantic — success (from 03-parent-dashboard.html)
        good: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        // Semantic — warning
        grow: {
          50:  "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        // Semantic — danger
        soft: {
          50:  "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      boxShadow: {
        card:        "0 0 0 1px rgba(30,27,75,.03), 0 1px 2px rgba(89,37,168,.04), 0 4px 12px -4px rgba(89,37,168,.06)",
        "card-hover":"0 0 0 1px rgba(30,27,75,.03), 0 4px 12px rgba(89,37,168,.08), 0 8px 24px -8px rgba(89,37,168,.12)",
        elevated:    "0 8px 24px rgba(89,37,168,.1), 0 2px 6px rgba(89,37,168,.06)",
        ring:        "0 0 0 3px rgba(89,37,168,0.15)",
      },
      borderRadius: {
        card:   "12px",
        button: "8px",
        pill:   "9999px",
        input:  "10px",
        xl:     "12px",
        "2xl":  "16px",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
