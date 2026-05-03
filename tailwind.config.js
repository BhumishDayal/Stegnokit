/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#03040a",
          900: "#05060f",
          800: "#080a18",
          700: "#0d1024",
          600: "#13172e",
          500: "#1c2140",
        },
        neon: {
          cyan: "#00e5ff",
          ice: "#7df9ff",
          violet: "#a855f7",
          indigo: "#6366f1",
          magenta: "#ff2bd6",
          lime: "#b6ff3a",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-30%)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translateY(130%)", opacity: "0" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "47%": { opacity: "1" },
          "50%": { opacity: "0.6" },
          "53%": { opacity: "1" },
          "82%": { opacity: "1" },
          "85%": { opacity: "0.5" },
          "88%": { opacity: "1" },
        },
        glow: {
          "0%, 100%": { filter: "drop-shadow(0 0 12px rgba(0,229,255,0.35))" },
          "50%": { filter: "drop-shadow(0 0 28px rgba(168,85,247,0.55))" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.6)", opacity: "0.3" },
        },
        rotateSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        scan: "scan 7s linear infinite",
        flicker: "flicker 4s linear infinite",
        glow: "glow 4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        pulseDot: "pulseDot 2.4s ease-in-out infinite",
        rotateSlow: "rotateSlow 28s linear infinite",
      },
      backgroundImage: {
        "grid-fine":
          "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
        "grid-coarse":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse at center, transparent 0%, rgba(3,4,10,0.85) 70%, rgba(3,4,10,1) 100%)",
        "neon-line":
          "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.9) 50%, transparent 100%)",
      },
      backgroundSize: {
        "grid-fine": "32px 32px",
        "grid-coarse": "80px 80px",
      },
      boxShadow: {
        "neon-cyan": "0 0 30px -4px rgba(0,229,255,0.55)",
        "neon-violet": "0 0 30px -4px rgba(168,85,247,0.55)",
        "soft-glow": "0 1px 0 rgba(255,255,255,0.06) inset, 0 0 60px -20px rgba(168,85,247,0.4)",
      },
    },
  },
  plugins: [],
};
