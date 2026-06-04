import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "shield-blue": "#3B82F6",
        "shield-red": "#EF4444",
        "shield-green": "#22C55E",
        "shield-orange": "#F97316",
        "trust-trusted": "#22C55E",
        "trust-untrusted": "#EF4444",
        "trust-sensitive": "#F97316",
        "bg-primary": "#0a0a0f",
        "bg-secondary": "#111118",
        "bg-card": "#16161f",
        "border-subtle": "#1e1e2e",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-red": "pulse-red 2s ease-in-out infinite",
        "taint-flow": "taint-flow 1.5s ease-in-out infinite",
        "shield-glow": "shield-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-red": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
        "taint-flow": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        "shield-glow": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(59, 130, 246, 0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(59, 130, 246, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
