import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        brand: { DEFAULT: "#1e3d2b", deep: "#14291d", gold: "#c9a227" },
        paper: "#faf8f4",
      },
    },
  },
  plugins: [],
};

export default config;
