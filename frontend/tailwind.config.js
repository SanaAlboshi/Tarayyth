/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F2A2E",
        surface: "#F6F5F1",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#0E6E5C",
          dark: "#0A4F42",
          light: "#E4F2EE",
        },
        accent: "#C98A3E",
        danger: "#B3413A",
        warn: "#C9862F",
        ok: "#12805F",
      },
      fontFamily: {
        display: ["'IBM Plex Sans Arabic'", "Tahoma", "sans-serif"],
        body: ["'IBM Plex Sans Arabic'", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};
