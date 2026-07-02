/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        ink: "#13151A",
        crimson: {
          50: "#FCEAEB",
          100: "#F4C7CA",
          200: "#E8959B",
          400: "#C13A45",
          500: "#A8232F",
          600: "#8A1C26",
          700: "#6B151D",
        },
        emerald: {
          50: "#E9F5F0",
          100: "#C8E6D9",
          400: "#26835F",
          500: "#1F6F54",
          600: "#185941",
        },
        brass: {
          50: "#FBF4E3",
          100: "#F0DFAD",
          400: "#D4A843",
          500: "#B68E34",
        },
        slate: {
          50: "#F5F5F4",
          100: "#E8E8E6",
          200: "#D4D4D1",
          400: "#8A8F98",
          500: "#65686F",
          600: "#4A4D53",
          700: "#34363A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        seal: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(19, 21, 26, 0.04), 0 2px 12px rgba(19, 21, 26, 0.04)",
        lifted: "0 4px 16px rgba(19, 21, 26, 0.06), 0 12px 32px rgba(19, 21, 26, 0.08)",
        ring: "0 0 0 1px rgba(168, 35, 47, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scan-trace": {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "scan-trace": "scan-trace 2.5s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
