/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FDFBF7",
        ink: "#1C2B33",
        crimson: {
          50: "#FBEAEC",
          100: "#F3C9CE",
          400: "#A8434E",
          500: "#8B1E2B",
          600: "#721823",
          700: "#5A131C",
        },
        pine: {
          50: "#EBF3EF",
          100: "#CFE3D8",
          500: "#2F5D4E",
          600: "#264B3F",
        },
        gold: {
          100: "#F3E6C4",
          400: "#C9A14A",
          500: "#B58E3B",
        },
        slate: {
          50: "#F4F5F6",
          100: "#E7E9EB",
          400: "#7C8791",
          500: "#5C6670",
          600: "#46505A",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      borderRadius: {
        seal: "999px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(28, 43, 51, 0.06)",
        lifted: "0 8px 28px rgba(28, 43, 51, 0.10)",
      },
    },
  },
  plugins: [],
};
