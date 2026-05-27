/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      colors: {
        primary: "#F97316",
        primaryDark: "#C2410C",
        primaryLight: "#FFEDD5",
        bg: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E5E7EB",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        textMuted: "#9CA3AF",
        success: "#22C55E",
        successDark: "#15803D",
        successLight: "#DCFCE7",
        warning: "#F59E0B",
        danger: "#DC2626",
        sidebar: "#0B1F2A",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
