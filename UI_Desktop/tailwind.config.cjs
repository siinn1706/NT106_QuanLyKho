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
          DEFAULT: "#00BCD4", // cyan more vibrant
          dark: "#0097A7",
          light: "#26C6DA",
        },
        danger: "#F44336",
        warning: "#FFC107",
        success: "#4CAF50",
        info: "#2196F3",
      },
      backgroundColor: {
        'zinc-925': '#18181f',
      },
    },
  },
  plugins: [],
};
