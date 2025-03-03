/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: {
          DEFAULT: "hsl(var(--background))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
        },
        ring: "hsl(var(--ring))",
        gray: {
          200: "#E5E7EB",
        },
        neutral: {
          500: "#737373",
        },
      },
    },
  },
  plugins: [],
} 