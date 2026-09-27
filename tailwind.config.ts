import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2f9",
          100: "#d7e0ef",
          200: "#b0c1df",
          300: "#89a2cf",
          400: "#5c7fb8",
          500: "#3a5f9c",
          600: "#2c4a7d", // əsas korporativ mavi
          700: "#213a63",
          800: "#182a48",
          900: "#101d33",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f6f7fa",
          border: "#e3e6ec",
        },
        positive: "#1f7a4d",
        negative: "#b3261e",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 29, 51, 0.06), 0 1px 6px rgba(16, 29, 51, 0.04)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
export default config;
