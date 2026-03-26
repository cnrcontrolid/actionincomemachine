import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FFAA00",
          green: "#30B33C",
          "orange-light": "#FFF3CC",
          "green-light": "#D4F0D6",
        },
        // kept for backward compat during migration
        amber: {
          brand: "#FFAA00",
          light: "#FFF3CC",
          wash: "#FFFBF0",
        },
        cream: "#FAF7F2",
        charcoal: "#1F1F1F",
        warmgray: "#6B6560",
        sage: "#30B33C",
      },
      fontFamily: {
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "bounce-slow": "bounce 2s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
