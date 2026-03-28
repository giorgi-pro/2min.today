import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "../../packages/ui/src/**/*.{svelte,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      colors: {
        // Brand palette
        primary: {
          DEFAULT: "#FF6347", // tomato
          container: "#FF9B8A", // lighter for hover
          dark: "#CC3E28", // pressed
        },
        secondary: {
          DEFAULT: "#0F7A91", // teal
          container: "#7CC5D0",
          dark: "#09566A",
        },
        tertiary: {
          DEFAULT: "#637588", // slate
          container: "#D4DCE4",
        },
        neutral: {
          DEFAULT: "#1B242C",
        },

        // Surface hierarchy — derived from neutral light scale
        surface: {
          DEFAULT: "#F4F7F9",
          "container-lowest": "#FFFFFF",
          "container-low": "#EDF1F4",
          container: "#E3E8EC",
          "container-high": "#D8DFE5",
          dim: "#C8D1D8",
        },

        // Semantic role colors
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-surface": "#1B242C",
        "secondary-fixed": "#E3E8EC",
        "on-secondary-fixed": "#1B242C",
        "outline-variant": "#B8C4CC",
      },
      letterSpacing: {
        label: "0.1em",
        display: "-0.03em",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
