/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0F2A2E",
        "ink-soft": "#274449",
        "ink-mute": "#5C7278",
        surface: "#F6F5F1",
        "surface-alt": "#EFEDE6",
        card: "#FFFFFF",
        outline: "#E4E1D9",
        primary: {
          DEFAULT: "#0E6E5C",
          dark: "#0A4F42",
          light: "#E4F2EE",
          soft: "#B7E0D5",
        },
        accent: {
          DEFAULT: "#C98A3E",
          dark: "#9E6B2F",
          light: "#FDF0DC",
        },
        gold: "#B8935B",
        danger: {
          DEFAULT: "#B3413A",
          light: "#FBE9E7",
          dark: "#8A2F2A",
        },
        warn: {
          DEFAULT: "#C9862F",
          light: "#FDF3E1",
          dark: "#8A5A1B",
        },
        ok: {
          DEFAULT: "#12805F",
          light: "#DFF5EC",
          dark: "#0A5A42",
        },
        info: {
          DEFAULT: "#2A6FBE",
          light: "#E4EEFB",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans Arabic'", "Tahoma", "sans-serif"],
        body: ["'IBM Plex Sans Arabic'", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 42, 46, 0.04), 0 4px 20px rgba(15, 42, 46, 0.05)",
        elevated: "0 4px 12px rgba(15, 42, 46, 0.06), 0 12px 40px rgba(15, 42, 46, 0.08)",
        glow: "0 0 0 6px rgba(14, 110, 92, 0.08)",
        inner: "inset 0 1px 2px rgba(15, 42, 46, 0.06)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at 20% 20%, rgba(14, 110, 92, 0.25), transparent 55%), radial-gradient(circle at 80% 30%, rgba(201, 138, 62, 0.18), transparent 60%), linear-gradient(135deg, #0A2C2C 0%, #0F3A38 60%, #123F3B 100%)",
        "shine-gradient":
          "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(14, 110, 92, 0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(14, 110, 92, 0)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
