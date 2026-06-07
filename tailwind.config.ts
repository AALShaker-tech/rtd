import type { Config } from "tailwindcss";

/**
 * RTD luxury design system.
 * Base: deep charcoal/black. Accent: soft gold. Surfaces: warm ivory.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#101012",
          50: "#f6f6f7",
          100: "#e6e6e8",
          800: "#1c1c1f",
          900: "#141416",
          950: "#0b0b0d",
        },
        gold: {
          DEFAULT: "#c8a35b",
          light: "#e2c789",
          dark: "#a8842f",
          50: "#fbf7ee",
          100: "#f3e8cf",
        },
        ivory: {
          DEFAULT: "#f7f4ee",
          warm: "#fbf9f4",
          deep: "#ede7da",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        luxe: "0 20px 60px -20px rgba(16, 16, 18, 0.35)",
        "luxe-gold": "0 18px 50px -22px rgba(200, 163, 91, 0.55)",
        card: "0 8px 30px -12px rgba(16, 16, 18, 0.18)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #e2c789 0%, #c8a35b 45%, #a8842f 100%)",
        "charcoal-gradient": "linear-gradient(160deg, #1c1c1f 0%, #101012 60%, #0b0b0d 100%)",
        "hero-glow": "radial-gradient(70% 60% at 70% 20%, rgba(200,163,91,0.18) 0%, rgba(16,16,18,0) 60%)",
      },
      borderRadius: {
        luxe: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "draw-line": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "draw-line": "draw-line 0.8s ease both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
