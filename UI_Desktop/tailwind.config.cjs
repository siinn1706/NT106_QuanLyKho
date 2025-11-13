/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // dùng class 'dark' cho dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#06B6D4", // cyan
          dark: "#0891B2",
        },
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
      },
    },
  },
  plugins: [],
};
