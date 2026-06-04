import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Geist'", "system-ui", "sans-serif"],
      },
      colors: {
        atlas: {
          bg: "#050810",
          surface: "#0a0f1e",
          border: "#1a2040",
          accent: "#4f8ef7",
          glow: "#6366f1",
          hot: "#f97316",
          warm: "#eab308",
          cool: "#22d3ee",
          muted: "#4a5568",
          text: "#e2e8f0",
          dim: "#64748b",
        }
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
